<?php
$url = $_POST["url"];

echo json_encode(array('error' => !allowEmbed($url)));




function allowEmbed($url) {
    $header = @get_headers($url, 1);

    // Check X-Frame-Option
    if (isset($header['X-Frame-Options']) && (stripos($header['X-Frame-Options'], 'SAMEORIGIN') !== false || stripos($header['X-Frame-Options'], 'deny') !== false)) {
        return false;
    }

    // Everything passed? Return true!
    return true;
}

?>