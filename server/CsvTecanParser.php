<?php
require_once "string.php";
require_once "CsvParser.php";

/*
Tecan CSV files BNF:

root ::= experiment_info_line+ ('Mode' mode_description_line+)+ none_line+ ('Temp. [°C]' measure_line+ none_line+)+
 */

class CsvTecanParser extends CsvParser {

    const ABSORBANCE = 0;
    const RFU = 1;
    const RLU = 2;

	/**
	 * @var int index of current program (i.e. mode)
	 */
	var $currentProgramIndex = -1;

	/**
	 * @var array List of programs (modes)
	 */
	var $programs = array();

	/**
	 * @var int
	 */
	var $currentWell;

    /**
     * @var string
     */
    var $currentMeasureSubType;

	function wellNumber($wellName) {
		return (ord($wellName[0]) - 65)*12 + intval(substr($wellName, 1)) - 1;
	}

	/**
	 * @param $d string
	 * @return string
	 */
	function delayToTime($d) {
		date_default_timezone_set('Europe/Paris');
		$date = new DateTime("2000-01-01");
		$d1 = $date->add(new DateInterval("PT" . intval($d/1000) . "S"));
		return $d1->format('H:i:s');
	}

	function handleLine() {
		$cell1 = $this->getCell(0);

		if ( $cell1 == "Mode" ) { // new program description
			$this->insideSection = self::PROGRAM_DESCRIPTION;
			$this->wr["programs"][++$this->currentProgramIndex] = array("Name" => $this->nextCell(0));
		}
		else if ( $cell1 == "Start Time:" ) { // initial date/time
            list($date, $time) = explode (' ', $this->nextCell(0));
            list($day, $month, $year) = explode ('/', $date);
            if ( count(explode (':', $time)) == 2 ) // seconds part missing
                $time .= ":00";

			$this->wr["initialTime"] = $year . "-" . $month . "-" . $day . "T" . $time;

            // since this is the end of the description section, we create the array of measures for each well

            for ($w = 0; $w <= 95; $w++) {
                $this->wr["wells"][$w]["measures"] = array_fill(0, $this->currentProgramIndex + 1, null);
            }
		}
        else if ( $cell1 == "Cycle Nr." ) { // previous line was measure subtype name
            $mst = $this->prevLineFirstCell;
            $lmst = strtolower($mst);
            if ( startsWith($lmst, "abs") )
                $measureType = 0;
            else if ( startsWith($lmst, "rfu") || startsWith($lmst, "fluo") || startsWith($lmst, "gfp") || startsWith($lmst, "mcherry") )
                $measureType = 1;
            else if ( startsWith($lmst, "rlu") )
                $measureType = 2;
            else throw new Exception("Line " . (1+$this->currentLine) . ", Invalid measure type: $mst");

            array_push($this->wr["measureSubTypes"], array("name" => $mst, "type" => $measureType));
            $measureSubTypesIndex = count($this->wr["measureSubTypes"]) - 1;

            $this->currentMeasureSubType = $measureSubTypesIndex;
            $this->wr["programs"][$measureSubTypesIndex]["Name"] .= ": " . $mst;
        }
		else if ( startsWith($cell1, "Temp. [") ) { // new measure table
			$this->insideSection = self::MEASURES;
		}
		else if ( $cell1 == null && $this->insideSection == self::PROGRAM_DESCRIPTION ) { // end of modes description
			$this->insideSection = self::NONE;
		}
		else if ( $cell1 != null && $this->insideSection == self::PROGRAM_DESCRIPTION ) {
            $this->wr["programs"][$this->currentProgramIndex][$cell1] = $this->nextCell(0);
		}
		else if ( $cell1 == null && $this->insideSection == self::MEASURES ) { // end of measures table
			$this->insideSection = self::NONE;
		}
		else if ( $cell1 != null && $this->insideSection == self::MEASURES ) { // measures table line

			if ( preg_match("/^[A-H][0-9]+$/", $cell1) ) {	// measures
				$this->currentWell = $this->wellNumber($cell1);
                $originalSignal = array();
                $nbCol = count($this->currentLine);
				for($c = 1; $c < $nbCol; $c++)
					if ( $this->currentLine[$c] != null )
                        $originalSignal[] = $this->convertValue($this->currentLine[$c]);
                $this->wr["wells"][$this->currentWell]["measures"][$this->currentMeasureSubType]["originalSignal"] = $originalSignal;
			}
			else if ( startsWith($cell1, "Time ") ) {	// time
                $time = array();
                $nbCol = count($this->currentLine);
				for($c = 1; $c < $nbCol; $c++)
					if ( $this->currentLine[$c] != null )
						$time[] = $this->convertTime($this->currentLine[$c]);
                $this->wr["wells"][$this->currentWell]["measures"][$this->currentMeasureSubType]["time"] = $time;
			}
		}
		else if ( $this->insideSection == self::NONE ) {
		}
		else throw new Exception("Line " . (1+$this->currentLine) . ", Unhandled case: outside all possible sections");
	}

	function convertTime($time) {
		return round(((float)str_replace(",", ".", $time)) / 1000 / 60, 8); //  / 1000 / 60 : ms -> min
	}

	function convertValue($val) {
		return ( strpos($val, ",") > 0 ? round((float)(str_replace(",", ".", $val)), 4) : (int)$val );
	}

	static function test() {

        $t1 = microtime(true);

        //$csvFile = "../Valentin-Tecan-20140201.csv";
        //$csvFile = "../tecan/Valentin-02042014.csv";
        //$csvFile = "../tecan/nils-03-10-2014.csv";
        $csvFile = "c:/users/page/desktop/cindy-20140930.csv";

        $p = new CsvTecanParser($csvFile, ';');
        $p->parse();

		var_dump($p->wr);
        $t2 = microtime(true);
        echo "Time:" . ($t2-$t1) . "s";
	}
}
//CsvTecanParser::test();

