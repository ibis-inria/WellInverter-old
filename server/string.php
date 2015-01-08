<?php
/**
 * Retourne true ssi la chaîne $s commence par $start
 *
 * @param string $s
 * @param string $start le début recherché
 * @return bool
 */
function startsWith($s, $start) {
	return strpos($s, $start) === 0;
}

/**
 * Retourne true ssi la chaîne $s se termine par $end
 *
 * @param string $s
 * @param string $end la fin recherchée
 * @return bool
 */
function endsWith($s, $end) {
	$length = strlen($end);
	if ( $length == 0 )
		return true;
	$start = $length * -1; //negative
	return (substr($s, $start) === $end);
}

/**
 * Retourne true ssi la chaîne $s contient la sous-chaîne $ss
 *
 * @param string $s
 * @param string $ss la sous-chaîne recherchée
 * @return bool
 */
function contains($s, $ss) {
	return (strpos($s, $ss) !== false);
}

/**
 * Retourne le 1e mot d'une "phrase"
 * @param $s string, une "phrase", i.e. une suite de mots
 */
function firstWord($s) {
	$words = explode(" ", $s);
	return $words[0];
}