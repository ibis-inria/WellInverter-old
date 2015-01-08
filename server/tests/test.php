<?php

function parse ($url) {
    $xmlString= file_get_contents($url);
    $xml = simplexml_load_string($xmlString);
    $json = json_encode($xml);
    $array = json_decode($json,TRUE);
    var_dump($array);
    echo "\n\n<br>" . $json;
}

parse("http://localhost/WellReader4/Exp_07_11_19.xml");