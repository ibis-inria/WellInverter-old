<?php
require_once "CsvParser.php";

/*
Tecan CSV files BNF:

root ::= experiment_info_line+ ('Mode' mode_description_line+)+ none_line+ ('Temp. [°C]' measure_line+ none_line+)+
 */

class CsvFusionParser extends CsvParser {

	/**
	 * @var string[] header of columns on the line starting with "Well Number": "Time", "Absorbance", "Sample Type" ...
	 */
	var $columnType;

    /**
     * @var int timestamp of experiment start
     */
    var $initialTime;

    /**
     * @var DateTime of experiment start
     */
    var $initialDateTime;

    /**
     * @var int number of days to add to time because of date change in measure
     */
    var $deltaDays = 0;

    /**
     * @var int hour of previous measure: used for detecting date change
     */
    var $previousMeasureHour;

    //function handleLine() {}
	function handleLine() {
		$cell1 = $this->getCell(0);

		if ( $cell1 == "Assay:" ) { // new program
			$this->insideSection = self::PROGRAM_DESCRIPTION;
			$this->currentProgramName = $this->nextCell(0);
			$this->currentProgram =  ( ! isset($this->wr["programs"][$this->currentProgramName]) ? array() : null );
		}

		if ( $cell1 == "Well Number" ) { // new measure table
			if ( $this->currentProgram !== null ) {
				$this->wr["programs"][$this->currentProgramName] = $this->currentProgram;
				$this->currentProgram = null;
				$this->currentProgramName = null;
			}
			$this->insideSection = self::MEASURES;

			$this->columnType = array();
			foreach($this->currentLine as $cell) {
				$c = trim($cell);
				foreach(array("Well Number", "Time", "RFU", "RLU", "Absorbance", "Sample Type", "Flags") as $header) {
					if ( startsWith($c, $header) ) {
						$this->columnType[] = $header;
						if ( $header == "RFU" || $header == "RLU" || $header == "Absorbance" )
							$this->currentMeasureType = $this->measureType($header);
						break;
					}
				}
			}
		}
		else if ( $this->insideSection == self::PROGRAM_DESCRIPTION ) {
			if ( $this->currentProgram !== null ) {
				$key = null;
				foreach($this->currentLine as $cell) {
					$c = trim($cell);
					if ( $c != null ) {
						if ( $key == null )
							$key = $c;
						else {
							$this->currentProgram[$key] = $c;
							if ( contains($c, "Temperature Min/Max") && $this->initialDateTime == null ) {
								$cellParts = explode(" ", $c);
								list($hour, $min) = explode(":", $cellParts[1]);
								if ( $cellParts[2] == "PM" )
									$hour += 12;
								$this->initialDateTime = new DateTime("2000-01-01T" . $hour . ":" . $min . ":00" . "Z");
                                $this->previousMeasureHour =  $hour;
                                $this->wr["initialTime"] = "2000-01-01T" . $hour . ":" . $min . ":00";
                                $this->initialTime = mktime($hour, $min, 0, 1, 10, 2010);
							}
                            else if ( $key == "Detection Mode:") {
                                if ( startsWith($c, "Fluorescence") ) {
                                    $this->currentProgram["measureReference"] = "RFU";
                                    $this->currentProgram["measureReferenceType"] = "RFU";
                                }
                                else if ( startsWith($c, "Luminescence") ) {
                                    $this->currentProgram["measureReference"] = "RLU";
                                    $this->currentProgram["measureReferenceType"] = "RLU";
                                }
                                else if ( startsWith($c, "Absorbance") ) {
                                    $this->currentProgram["measureReference"] = "abs";
                                    $this->currentProgram["measureReferenceType"] = "Absorbance";
                                }
                                else throw new Exception("Line " . 1+$this->currentLine . ", Unhandled case: invalid detection mode");
                            }

                            $key = null;
						}
					}
				}
			}
		}
		else if ( $cell1 == null && $this->insideSection == self::MEASURES ) { // end of measures table
			$this->insideSection = self::NONE;
		}
		else if ( $cell1 != null && $this->insideSection == self::MEASURES ) {
            $nbCol = count($this->columnType);
			for ($c = 1; $c < $nbCol; $c++) {
                $type = $this->columnType[$c];
				if ( $type == "Time" )
                    $this->wr["wells"][$cell1 - 1]["measures"][$this->currentMeasureType]["time"][] = $this->convertTime($this->getCell($c));
				else if ( $type == "Absorbance" || $type == "RFU" || $type == "RLU" )
                    $this->wr["wells"][$cell1 - 1]["measures"][$this->currentMeasureType]["originalSignal"][] = $this->convertValue($this->getCell($c));
				/*
				else if ( $this->columnType[$c] == "Sample Type" ) {
				}
				else if ( $this->columnType[$c] == "Flags" ) {
				}
				*/
			}
		}
		else if ( $this->insideSection == self::NONE ) {
		}
		else throw new Exception("Line " . 1+$this->currentLine . ", Unhandled case: outside all possible sections");
	}

    function convertTime($time) {
        list($h, $m, $s) = explode(":", $time);

        // test adjustment because of date change
        if ( $h == "00" && $this->previousMeasureHour == 23 )
            $this->deltaDays += 1;
        else if ( $this->previousMeasureHour == 0 && $h == "23" ) // measure times are not always ascending !
            $this->deltaDays -= 1;

        $this->previousMeasureHour = (int)$h;
        return round((mktime($h, $m, $s, 1, 10+$this->deltaDays, 2010) - $this->initialTime) / 60, 4);

    }

    function convertValue($val) {
        $v = (float)$val;
        return ( $v != (int)$v ? round($v, 4) : (int)$v );
    }

	static function test() {
        $t1 = microtime(true);
		$p = new CsvFusionParser("tests/exp_2006_12_21b.csv", ',');
		$p->parse();
		//var_dump($p->wr);
        $t2 = microtime(true);
        echo "Time:" . ($t2-$t1) . "s";
	}
}

//CsvFusionParser::test();