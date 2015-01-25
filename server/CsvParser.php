<?php
require_once "string.php";

/**
 * CsvParser is a base class for CsvFusionParser and CsvTecanParser
 */
abstract class CsvParser {

	const NONE = 1;
	const PROGRAM_DESCRIPTION = 2;
	const MODE_DESCRIPTION = 3;
	const MEASURES = 4;

	/**
	 * @var array
	 */
	var $wr;

	/**
	 * @var string path of CSV file
	 */
	var $inputPath;

	/**
	 * @var resource associated with CSV file
	 */
	var $inputHandle;

	/**
	 * @var bool EOF of CSV file ?
	 */
	var $eof;

	/**
	 * @var string field separator
	 */
	var $separator;

	/**
	 * @var string[] cells of current line
	 */
	var $currentLine = array();

	/**
	 * @var int index of current line
	 */
	var $lineIndex = 0;

	/**
	 * @var string content of previous line's first cell
	 */
	var $prevLineFirstCell = null;

	/**
	 * @var int EXPERIMENT_INFO | ...
	 */
	var $insideSection;

	/**
	 * @var array
	 */
	var $currentProgram;

	/**
	 * @var string
	 */
	var $currentProgramName;

	/**
	 * Constructor
	 *
	 * @param string $inputPath
	 * @param string $sep
	 * @throws Exception
	 */
	function __construct($inputPath, $sep) {
		$this->inputPath = $inputPath;
		$this->separator = $sep;

        date_default_timezone_set('Europe/Paris');

		$this->wr = array();
        $this->wr["wells"] = array();
        $this->wr["measureSubTypes"] = array();
        for ($w = 0; $w <= 95; $w++) {
            $this->wr["wells"][$w] = array("id" => $w);
			$this->wr["wells"][$w]["name"] = $this->wellName($w);
            $this->wr["wells"][$w]["measures"] = array(
				array("type" => 0, "subType" => 0),
				array("type" => 1, "subType" => 1),
				array("type" => 2, "subType" => 2));

        }

		if ( ($this->inputHandle = fopen($inputPath, "r")) === FALSE )
			throw new Exception("Error : file not found or not accessible for reading : " . $inputPath);
		$this->insideSection = self::NONE;
	}

	/**
	 * Name: 0 -> A1, 11 -> A12, 12-> B1, ...
	 */
	function wellName($wellIndex) {
		return chr(65 + floor($wellIndex / 12)) . ($wellIndex % 12 + 1);
	}

    /**
     * return measure type (0, 1 or 2) from measure name
     * @param string $measureName name of measure
     * @return int measure tupe
     */
    function measureType($measureName) {
        switch($measureName) {
            case "Absorbance": return 0;
            case "RFU": return 1;
            case "RLU": return 2;
        }
        return null; // useless but compiler happy
    }

	/**
	 * Method implemented in subclasses
	 */
	abstract function handleLine();

	/**
	 * Returns $c-th cell of current line
	 *
	 * @param $c int
	 * @return string
	 */
	function getCell($c) {
		if ( $c < count($this->currentLine) )
			return trim($this->currentLine[$c]);
		else return null;
	}

	/**
	 * @param int $c starting index of cell
	 * @return string content of next non empty cell in the current line
	 */
	function nextCell($c) {
		$c++;
		while( $c < count($this->currentLine) && $this->getCell($c) == null )
			$c++;
		return $this->getCell($c);
	}

	/**
	 * read a line in CSV file
	 */
	function readLine() {
		$this->prevLineFirstCell = $this->getCell(0);
        $elements = fgetcsv($this->inputHandle, 32000, $this->separator);
        if ( $elements !== FALSE ) {
            for ($c = count($elements)-1; $c >= 0; $c--) {
                if ( $elements[$c] != "" )
                    break;
            }
		    $this->currentLine = array_slice($elements, 0, $c+1);
        }
		else $this->eof = true;

		$this->lineIndex++;
	}

	/**
	 * Main method
	 */
	function parse() {
		$this->readLine();
		while ( ! $this->eof ) {
			$this->handleLine();
			$this->readLine();
		}
		fclose($this->inputHandle);
	}
}



