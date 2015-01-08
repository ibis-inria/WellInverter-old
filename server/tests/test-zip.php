<?php
echo "here";

    $zip = new ZipArchive();
    if ( $zip->open("curves.zip", ZIPARCHIVE::CREATE) !== TRUE )
        echo("cannot create 'curves.zip' file");

    foreach (glob("" . '*.txt') as $f) {
        if ( ! $zip->addFile($f) )
            echo("cannot add '$f' to 'curves.zip' file");
    }

    $zip->close();

    header('Content-Description: File Transfer');
    header('Content-Type: application/octetstream');
    header('Content-Disposition: attachment; filename=' . "curves.zip");
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . filesize("curves.zip"));
    readfile("curves.zip");

