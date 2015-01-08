<?php
include_once "string.php";
include_once "XlsxTecanParser.php";
include_once "CsvFusionParser.php";

error_reporting(E_ALL);

class WellReaderController {

    const ABSORBANCE = 0;
    const RFU = 1;
    const RLU = 2;

	/**
	 * Root directory of experiments
	 */
	const EXPERIMENT_ROOT_DIR = "../experiments";

	/**
	 * @var array associative array contains all data about an experiment
     * Fields have the same name and same value as the JSON object, contrarily to WR3.
     * Main differences :
     * - field names are camelized in WR4 whereas they are underscored in WR3
     * - Wells ID are started at 0 in WR4 and at 1 in WR3
     * - measures are index by number in WR4: 0 = abs, 1=RFU, 2=RLU
	 */
	var $wr = array();

	/**
	 * @var string name of experiment
	 */
	var $experimentName;

    /**
     * @var array name of measure types
     */
    var $measureTypes;

    /**
     * @var string current user name
     */
    var $userName;

	/**
	 * Constructor
	 *
	 * @param $wr array
	 */
	function __construct($wr) {
		$this->wr = $wr;
        $this->measureTypes = array("Absorbance", "RFU", "RLU");
	}

	/**
	 * Current user
	 *
	 * @return string Current user name
	 */
	function currentUser() {
		return $this->userName;
	}

    /**
     * Set current user
     *
     * @param string $userName Current user name
     */
    function setCurrentUser($userName) {
        $this->userName = $userName;
    }

	/**
	 * @return string Path of current user's experiments
	 */
	function currentUserDir() {
		return WellReaderController::EXPERIMENT_ROOT_DIR . "/" . $this->currentUser();
	}

    /**
     * @param int $id well id in [0 ; 95]
     * @return string name of well
     */
    function getWellName($id) {
        return chr(65 + floor($id / 12)) . ($id % 12 + 1);
    }

	/**
	 * Path of an experiment of the current user
	 *
	 * @param string $expName Name of an experiment (corresponds to directory name)
	 * @return string
	 */
	function experimentFile($expName) {
		return $this->currentUserDir() . "/" . $expName . ".json";
	}

	/**
	 * List of experiments (i.e. of JSON files) of current user
	 * @return string[]
	 */
	function currentUserExperiments() {
		$experimentFiles = array();
		$files = glob($this->currentUserDir() . '/*.json');
		foreach ($files as $file)
			$experimentFiles[] = basename($file, '.json');
		return $experimentFiles;
	}

	/**
	 * Does an experiment with name $expName exist for current user ?
	 *
	 * @param string $expName name of an experiment
	 * @return bool
	 */
	function existsExperiment($expName) {
		return file_exists($this->experimentFile($expName));
	}

	/**
	 * Read a WR 3.0 XML file and store the objects it contains in the $wr instance 
	 *
	 * @param string $path path of the XML file
	 * @throws Exception
	 */
	public function readXML($path) {
		$wr = array();

		$doc = new DOMDocument();
		$doc->load($path);

		$experimentInfoElt = $doc->getElementsByTagName("experiment_info")->item(0); /** @var DOMElement $experimentInfoElt  */

		// initial_time
		$wr["initialTime"] = $experimentInfoElt->getElementsByTagName("initial_time")->item(0)->nodeValue;

		// program
		$programsElt = $experimentInfoElt->getElementsByTagName("program");
		foreach ($programsElt as $programElt) {	/** @var DOMElement $programElt  */
			$programName = $programElt->getAttribute("name");
			$program = array();
			foreach ($programElt->getElementsByTagName("header") as $headerElt) {	/** @var DOMElement $headerElt  */
				$program[$headerElt->getAttribute("name")] = $headerElt->getAttribute("value");
				$wr["programs"][$programName] = $program;
			}
			$measureReferenceElt = $programElt->getElementsByTagName("measure_reference")->item(0); /** @var DOMElement $measureReferenceElt  */
			$wr["programs"][$programName]["measureReference"] = $measureReferenceElt->nodeValue;
			$wr["programs"][$programName]["measureReferenceType"] = $measureReferenceElt->getAttribute("type");
		}

		// global_parameters
		$wr["plasmidCopies"] = $doc->getElementsByTagName("plasmid_copies")->item(0)->nodeValue;
		$wr["rfuDefaultGamma"] = $doc->getElementsByTagName("RFU_default_gamma")->item(0)->nodeValue;
		$wr["rluDefaultGamma"] = $doc->getElementsByTagName("RLU_default_gamma")->item(0)->nodeValue;
		$wr["proteinDefaultGamma"] = $doc->getElementsByTagName("protein_default_gamma")->item(0)->nodeValue;
		$wr["absorbanceDetectionLimit"] = $doc->getElementsByTagName("absorbance_detection_limit")->item(0)->nodeValue;

		// well
        $wr["wells"] = array();
		foreach ($doc->getElementsByTagName("well") as $wellElt) {	/** @var DOMElement $wellElt  */
			$currentWell = array();
            $currentWell["sampleType"] = $wellElt->getAttribute("sample_type");
            $currentWell["id"] = $wellElt->getAttribute("id") - 1;

			// measure
			foreach ($wellElt->getElementsByTagName("measure_type") as $measureTypeElt) {/** @var DOMElement $measureTypeElt  */
				$measureTypeString = $measureTypeElt->getAttribute("name");
				$currentMode = null;
				if ( startsWith($measureTypeString, "Absorbance"))
					$currentMode = WellReaderController::ABSORBANCE;
				else if ( startsWith($measureTypeString, "RFU") )
					$currentMode =  WellReaderController::RFU;
				else if ( startsWith($measureTypeString, "RLU") )
					$currentMode = WellReaderController::RLU;
				else throw new Exception("Unhandled measure type: " . $measureTypeString);

				$currentWell["measures"][$currentMode]["type"] = $currentMode;
				$measureElt = $measureTypeElt->getElementsByTagName("measure")->item(0);	/** @var DOMElement $measureElt  */
				$currentMeasure = $currentWell["measures"][$currentMode];
				if ( $measureElt->hasAttribute("is_background") )
					$currentMeasure["isBackground"] = ( $measureElt->getAttribute("is_background") == "true" ? 1 : 0 );
				$currentMeasure["name"] = $measureElt->getAttribute("name");

				// value
				foreach ($measureElt->getElementsByTagName("value") as $valueElt) {	/** @var DOMElement $valueElt  */
					$currentMeasure["time"][] = (float)$valueElt->getAttribute("time");
					if ( $valueElt->hasAttribute("original_signal") )
						$currentMeasure["originalSignal"][] = (float)$valueElt->getAttribute("original_signal");

					if ( $valueElt->hasAttribute("corrected_signal") )
						$currentMeasure["correctedSignal"][] = (float)$valueElt->getAttribute("corrected_signal");

					if ( $valueElt->hasAttribute("flag") )
						$currentMeasure["flag"][] = $valueElt->getAttribute("flag");
					else $currentMeasure["flag"][] = "0"; // null inappropriate

					if ( $valueElt->hasAttribute("outlier") && $valueElt->getAttribute("outlier") == "true" )
						$currentMeasure["outlier"][] = 1;
					else $currentMeasure["outlier"][] = 0;
				}

				// background
				if ( $measureElt->getElementsByTagName("background_correction")->length > 0 ) {
					$bgCorrectionElt = $measureElt->getElementsByTagName("background_correction")->item(0);/** @var DOMElement $bgCorrectionElt  */
					$refWell = $bgCorrectionElt->getAttribute("reference_well");
					if ( $refWell != "-1" )
						$currentMeasure["backgroundReferenceWell"] = (int)$refWell - 1;
					$currentMeasure["backgroundTimeShift"] = (float)$bgCorrectionElt->getElementsByTagName("time_shift")->item(0)->nodeValue;
					$currentMeasure["backgroundGrowthDifference"]  = (float)$bgCorrectionElt->getElementsByTagName("growth_difference")->item(0)->nodeValue;
				}

				// fit
				if ( $measureElt->getElementsByTagName("fit")->length > 0 ) {
					$fitElt = $measureElt->getElementsByTagName("fit")->item(0);/** @var DOMElement $fitElt  */
					$currentMeasure["fitParameter"] = (float)$fitElt->getAttribute("parameter");
					$currentMeasure["fitSplineType"] = $fitElt->getAttribute("spline_type");
				}
                $currentWell["measures"][$currentMode] = $currentMeasure;
			}
            $wr["wells"][$wellElt->getAttribute("id") - 1] = $currentWell;
		}
        $this->wr = $wr;
	}

	/**
	 * Write an XML file formatted for WR 3.0 for the currently loaded instance of WellReader
	 *
	 * @param string $path path of the XML file written
	 * @throws Exception
	 */
	public function writeXML($path) {
		$wr = $this->wr;
		$writer = new XMLWriter();
		$writer->openURI($path);
		$writer->setIndent(true);
		$writer->setIndentString("   ");
		$writer->startDocument("1.0", "utf-8");

		$writer->startElement("wellreader");
		$writer->startElement("experiment_info");
		$writer->writeElement("initial_time", $wr["initialTime"]);
		foreach ($wr["programs"] as $name => $program) {
			$writer->startElement("program");
			$writer->writeAttribute("name", $name);
			foreach ($program as $key => $value) {
				if ( $key != "measureReference" && $key != "measureReferenceType") {
					$writer->startElement("header");
					$writer->writeAttribute("name", $key);
					$writer->writeAttribute("value", $value);
					$writer->endElement(); // header
				}
			}
            $writer->startElement("measure_reference");
            $writer->writeAttribute("type", ( isset($program["measureReferenceType"]) ? $program["measureReferenceType"]: $name) );
            $writer->text(( isset($program["measureReference"]) ? $program["measureReference"] : ( $name == "Absorbance" ? "abs" : $name) ));
            $writer->endElement();  // measure_reference

			$writer->endElement(); // program
		}
		$writer->endElement(); // experiment_info

		// global_parameters
		$writer->startElement("global_parameters");
		$writer->writeElement("plasmid_copies", isset($wr["plasmidCopies"]) ? $wr["plasmidCopies"] : "20");
		$writer->writeElement("RFU_default_gamma", isset($wr["rfuDefaultGamma"]) ? $wr["rfuDefaultGamma"] : "0.01");
		$writer->writeElement("RLU_default_gamma", isset($wr["rluDefaultGamma"]) ? $wr["rluDefaultGamma"] : "0.01");
		$writer->writeElement("protein_default_gamma", isset($wr["proteinDefaultGamma"]) ? $wr["proteinDefaultGamma"] : "0.001");
		$writer->writeElement("absorbance_detection_limit", isset($wr["absorbanceDetectionLimit"]) ? $wr["absorbanceDetectionLimit"] : "0.01");
		$writer->endElement();  // global_parameters

		// well
        $measureTypeNames = array("Absorbance", "RFU", "RLU");
        $measureNames = array("abs", "RFU", "RLU");
		foreach ($wr["wells"] as $well) {
			$writer->startElement("well");
			$writer->writeAttribute("id", $well["id"]+1);   // id in WR3 files are 1+id in WR4
			$writer->writeAttribute("name", $this->getWellName($well["id"]));
			$writer->writeAttribute("sample_type", ( isset($well["sampleType"]) ? $well["sampleType"] : "") );

			// measures
			foreach ($well["measures"] as $measure) {
				if ( isset($measure["type"]) && isset($measure["time"]) && count($measure["time"]) > 0 ) {
					$writer->startElement("measure_type");
					$writer->writeAttribute("name", $measureTypeNames[$measure["type"]]);

					//measure
					$writer->startElement("measure");
					if ( isset($measure["isBackground"]) && $measure["isBackground"] == 1 )
						$writer->writeAttribute("is_background", "true");
					$writer->writeAttribute("name", $measureNames[$measure["type"]]);
					foreach($measure["time"] as $m => $t) {
						$writer->startElement("value");
						if ( isset($measure["correctedSignal"][$m]) )
							$writer->writeAttribute("corrected_signal", $measure["correctedSignal"][$m]);
                        else $writer->writeAttribute("corrected_signal", "0");
						if ( isset($measure["flag"][$m]) && $measure["flag"][$m] !== "0" )
							$writer->writeAttribute("flag", $measure["flag"][$m]);
						if ( isset($measure["originalSignal"][$m]) )
							$writer->writeAttribute("original_signal", $measure["originalSignal"][$m]);
						if ( isset($measure["outlier"][$m]) && $measure["outlier"][$m] == 1 )
							$writer->writeAttribute("outlier", "true");
						$writer->writeAttribute("time", $measure["time"][$m]);
						$writer->endElement(); // value
					}

					// background
					$writer->startElement("background_correction");
					$writer->writeAttribute("reference_well",
                        ( isset($measure["backgroundReferenceWell"]) && $measure["backgroundReferenceWell"] != null ? 1+$measure["backgroundReferenceWell"] : -1 )); // id in WR3 files are 1+id in WR4
					$writer->writeElement("time_shift", ( isset($measure["backgroundTimeShift"]) ? $measure["backgroundTimeShift"] : "0") ) ;
					$writer->writeElement("growth_difference", ( isset($measure["backgroundGrowthDifference"]) ? $measure["backgroundGrowthDifference"] : "1") ) ;
					$writer->endElement(); // background_correction

					// fit
                    $writer->startElement("fit");
                    $writer->writeAttribute("parameter", "0.0");
                    $writer->writeAttribute("spline_type", "pp2sp");
                    $writer->endElement(); // fit

					$writer->endElement(); // measure
					$writer->endElement(); // measure_type
				}
			}
			$writer->endElement(); // well
		}
		$writer->endElement(); // wellreader
	}

	/**
	 * Load an experiment (WellReader instance) from a JSON experiment file
     *
	 * @param string $experimentName name of experiment
	 */
	function loadExperiment($experimentName) {
		$this->experimentName = $experimentName;
		$this->wr = array();
		if ( $this->existsExperiment($experimentName) )
            $this->wr = $this->readJSon($this->experimentFile($experimentName));
	}

	/**
	 * Reads a JSon file and deserialize an object with a given PHP class
	 *
     * @return array JSON object
	 * @param string $path path of JSon file
	 */
	function readJSon($path) {
		$jsString = file_get_contents($path);
		$json = json_decode($jsString, true);
        return($json);
	}
	/**
	 * Save an experiment (WellReader instance) to a JSON experiment file
	 */
	function saveExperiment() {
		$experimentFile = $this->experimentFile($this->experimentName);
		//if ( $experimentFile != null && file_exists($experimentFile) )
		//	rename($experimentFile, $experimentFile . ".bak");

        file_put_contents($experimentFile, json_encode($this->wr));
        echo "";
    }

    function exportCurves($curves) {

        foreach (glob($this->currentUserDir() . "/" . '*.txt') as $f) {
			unlink($f);
        }

		$hasExported = false;
        foreach($curves as $measureCurves) {
            foreach(array("originalCurve", "outlierFreeCurve", "synchronizedCurve", "subtractedBackgroundCurve", "growthRateCurve", "promoterActivityCurve", "reporterConcentrationCurve") as $curveType ) {
                if ( isset($measureCurves[$curveType]) && $measureCurves[$curveType] != null ) {
                    $curve = $measureCurves[$curveType];
                    $s = "";
                    for($c = 0; $c < count($curve['time']); $c++) {
                        $s .= $curve['time'][$c] . ";" .  $curve['value'][$c] . "\n";
                    }
                    file_put_contents($this->currentUserDir() . "/" . $curveType . "_" .  ($measureCurves['well']+1) . "_" . $measureCurves['type'] . ".txt", $s);
					$hasExported = true;
                }
            }
        }

		if ( $hasExported ) {
			$zip = new ZipArchive();
			@unlink($this->currentUserDir() . "/" . "curves.zip");
			if ($zip->open($this->currentUserDir() . "/" . "curves.zip", ZIPARCHIVE::CREATE) !== TRUE)
				echo("Cannot create '" . $this->currentUserDir() . "/curves.zip' file");
			foreach (glob($this->currentUserDir() . "/"  . '*.txt') as $f) {
				if (!$zip->addFile($f))
					echo("cannot add '$f' to '" . $this->currentUserDir() . "/curves.zip' file");
			}
			$zip->close();
		}
		else echo("No curve exported");
    }

    // ----------------------------------------------------------------------------------------
    // AJAX methods called by client
    // ----------------------------------------------------------------------------------------

        /**
         * List of current user's experiments
         */
	function ajaxExperimentsList() {
		echo json_encode($this->currentUserExperiments());
	}

    /**
     * Upload an experiment in JSON format
     * Ajax call: use echo to return value
     */
    function ajaxUploadJsonFile() {
        try {
            $tmpFile = $_FILES['file']['tmp_name'];

            if ( $tmpFile == "" )
                throw new Exception("Upload failed. Check server file upload configuration and upload_max_filesize in php.ini");

            if ( ! endsWith($_FILES['file']['name'], ".json") )
                throw new Exception("Uploaded file should have a .json extension.");
            $this->experimentName = basename($_FILES['file']['name'], ".json");

            if ( $this->existsExperiment($this->experimentName) )
                throw new Exception("An experiment with the name of uploaded file is already on the server. If you want to replace it, start by deleting the experiment with this name, and then upload JSON file again.");

            if ( ! preg_match("/^[a-zA-Z0-9_-]+/", $this->experimentName) )
                throw new Exception("'{$this->experimentName}' : the experiment file name contains forbidden characters. Use only letters, digits, '-' and '_' in file names.");

            $jsonFile = $this->currentUserDir() . "/" . $this->experimentName . ".json";

            if ( ! move_uploaded_file($tmpFile, $jsonFile) )
                throw new Exception("Upload of the experiment file has failed.");

            //$this->loadExperiment($this->experimentName);
        }
        catch(Exception $e) {
            echo $e->getMessage();
            return;
        }
        //$this->saveExperiment($this->experimentName);
        echo "";	// AJAX return value

    }
	/**
	 * Upload an experiment
	 * Ajax call: use echo to return value
	 */
	function ajaxUploadXmlExperiment() {
		try {
			$tmpFile = $_FILES['file']['tmp_name'];

            if ( $tmpFile == "" )
                throw new Exception("Upload failed. Check server file upload configuration and upload_max_filesize in php.ini");

			if ( ! endsWith($_FILES['file']['name'], ".xml") )
				throw new Exception("Uploaded file should have a .xml extension.");
			$this->experimentName = basename($_FILES['file']['name'], ".xml");

			if ( $this->existsExperiment($this->experimentName) )
				throw new Exception("An experiment with the name of uploaded file is already on the server. If you want to replace it, start by deleting the experiment with this name, and then upload XML file again.");

			// check if it has a <wellreader> root
			$isExperimentFile = false;
			$l = 0;
			$fh = fopen($tmpFile, 'r');
			while ( ! feof($fh) ) {
				$line = fgets($fh, 256);
				if ( startsWith(trim($line), "<wellreader ") )
					$isExperimentFile = true;
				$l++;
				if ( $l == 5 )
					break;
			}
			if ( ! $isExperimentFile )
				throw new Exception("Uploaded file is not a WellReader XML experiment file");

			if ( ! preg_match("/^[a-zA-Z0-9_-]+/", $this->experimentName) )
				throw new Exception("'{$this->experimentName}' : the experiment file name contains forbidden characters. Use only letters, digits, '-' and '_' in file names.");

			$xmlFile = $this->currentUserDir() . "/" . $this->experimentName . ".xml";

			if ( ! move_uploaded_file($tmpFile, $xmlFile) )
				throw new Exception("Upload of the experiment file has failed.");

			$this->readXML($xmlFile);
		}
		catch(Exception $e) {
			echo $e->getMessage();
			return;
		}
		$this->saveExperiment($this->experimentName);
		echo "";	// AJAX return value
	}

	/**
	 * Upload a XLSX file containing data from Tecan
	 *
	 * @throws Exception
	 */
	function ajaxUploadXlsxFile() {
		try {
			$tmpFile = $_FILES['file']['tmp_name'];
			$excelFile = $_FILES['file']['name'];

			if ( ! endsWith(strtolower($excelFile), ".xlsx") )
				throw new Exception("Uploaded file should have a .xlsx extension.");
			$this->experimentName = basename($excelFile, substr($excelFile, strlen($excelFile)-5));

			if ( $this->existsExperiment($this->experimentName) )
				throw new Exception("An experiment with the name of uploaded file is already on the server. If you want to replace it, start by deleting the experiment with this name, and then upload CSV file again.");

			$xlsxFile = $this->currentUserDir() . "/" . $this->experimentName .  "-" . "tecan" . ".xlsx";
			if ( ! move_uploaded_file($tmpFile, $xlsxFile) )
				throw new Exception("Upload of the experiment file has failed.");

			$p = new XlsxTecanParser($xlsxFile);
			$p->parse();
			$this->wr = $p->wr;
		}
		catch(Exception $e)	{
			echo $e->getMessage();
			return;
		}
		$this->saveExperiment();
		echo "";	// AJAX return value
	}

	/**
	 * Download an experiment.
	 * This is not an AJAX method, but it is called by the client via URL
	 *
	 * @param string $experimentName experiment name
	 */
    /*
	function downloadExperiment($experimentName) {
		$this->loadExperiment($experimentName);
		$xmlFile = realpath($this->currentUserDir()) . "/" . $experimentName . ".xml";
		$this->writeXML($xmlFile);
		if ( file_exists($xmlFile) ) {
			header("Content-disposition: attachment; filename=$experimentName.xml");
			header("Content-type: text/xml");
			$content = file_get_contents($xmlFile);
			echo $content;
		}
	}
    */
    function downloadExperiment($experimentName) {
        $jsonFile = realpath($this->currentUserDir()) . "/" . $experimentName . ".json";
        if ( file_exists($jsonFile) ) {
            header("Content-disposition: attachment; filename=$experimentName.json");
            header("Content-type: text/json");
            $content = file_get_contents($jsonFile);
            echo $content;
        }
    }

	/**
	 * Rename an experiment
	 * Ajax call: use echo to return value
	 *
	 * @param string $oldName  previous experiment name
	 * @param string $newName new experiment name
	 */
	function ajaxRenameExperiment($oldName, $newName) {;
		if ( ! file_exists($this->experimentFile($oldName)) )
			echo "No experiment with name '$oldName' is on the server.";
		else if ( file_exists($this->experimentFile($newName)) )
			echo "An experiment with name '$newName' is already on the server.";
		else if ( ! preg_match("/^[a-zA-Z0-9_-]+/", $newName) )
			echo "'$newName' : the experiment file name contains forbidden characters. Use only letters, digits, '-' and '_' in file names.";
		else {
			if ( rename($this->experimentFile($oldName), $this->experimentFile($newName)) )
				echo "";
			else echo "An error as occured while renaming '$oldName' in '$newName'";
		}
	}

	/**
	 * Delete an experiment
	 * Ajax call: use echo to return value
	 *
	 * @param string $experimentName experiment name
	 */
	function ajaxDeleteExperiment($experimentName) {
        $experimentFile = $this->experimentFile($experimentName);
		if ( ! file_exists($experimentFile) )
			echo ("No experiment with name '$experimentName' on the server.");
		else {
			echo "";
			unlink($experimentFile);
		}
	}

    function ajaxSaveExperiment($experimentName, $wr) {
		$backupFile = $this->currentUserDir() . "/backup/" . $experimentName . ".json" . "." . date("Y-m-d-H") . floor((date("i") / 10)) . "0";
		if ( file_exists($this->experimentFile($experimentName)) && ! file_exists($backupFile) )
			rename($this->experimentFile($experimentName), $backupFile);
			
        file_put_contents($this->experimentFile($experimentName), json_encode($wr));
        echo "";
    }

	function test() {
		$t1 = microtime(true);
		//$this->downloadExperiment("xx");
        //$this->ajaxExperimentsList();
        //$this->readXML("C:/www/WellReader4/experiments/mp/Exp_07_11_19.xml");
        $this->downloadExperiment('Valentin-Tecan-20140201');
		$t2 = microtime(true);
		echo "Time:" . ($t2-$t1) . "s";
	}
}

// --------------------------------------------------------------------------------------------
// Router for Ajax calls
// --------------------------------------------------------------------------------------------

$wr = array();
$wrc = new WellReaderController($wr);

if ( ! isset($_REQUEST['action']) ) {   // JSON : saveExperiment
    $json = json_decode(file_get_contents("php://input"), true);
    if ( $json['action'] == "saveExperiment" ) {
        $wrc->setCurrentUser($json['user']);
        $wrc->ajaxSaveExperiment($json['name'], $json['wr']);
    }
    else if ( $json['action'] == "exportCurves" ) {
		$wrc->setCurrentUser($json['user']);
		//file_put_contents("test.txt", file_get_contents("php://input"));
        $json = json_decode(file_get_contents("php://input"), true);
        $wrc->exportCurves($json['curves']);
    }
    else {
        $wrc->setCurrentUser("mp");
        $wrc->test();
        exit;
    }
}
else {
    $wrc->setCurrentUser($_REQUEST['user']);
    switch($_REQUEST['action']) {
        case "experimentsList": $wrc->ajaxExperimentsList(); break;
        case "uploadXmlExperiment": $wrc->ajaxUploadXmlExperiment(); break;
        case "uploadJsonFile": $wrc->ajaxUploadJsonFile(); break;
        case "uploadXlsxTecanFile": $wrc->ajaxUploadXlsxFile(); break;
        //case "uploadCsvFusionFile": $wrc->ajaxUploadCsvFile("fusion"); break;
        case "downloadExperiment": $wrc->downloadExperiment($_GET['name']); break;
        case "deleteExperiment": $wrc->ajaxDeleteExperiment($_POST['name']); break;
        case "renameExperiment": $wrc->ajaxRenameExperiment($_POST['oldName'], $_POST['newName']); break;
        default: echo "Undefined action in WellReaderController.php" ;
    }
}

