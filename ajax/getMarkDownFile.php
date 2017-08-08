<?php
@include("../lib/parsedown.php/Parsedown.php");
$Parsedown = new Parsedown();

$file = "../".$_POST['file'];

// Get file.md or file/file.md
if (file_exists($file)) {
	$f = fopen($file, 'r');
}
else {
	$path = explode("/", $file);
	$folder = $path[ sizeof($path)-1 ];
	unset( $path[ sizeof($path)-1 ] );
	$path = implode("/", $path);
	$folder = explode(".", $folder);
	$extention = $folder[1];
	$folder = $folder[0];

	$file = $path."/".$folder."/_".$folder.".".$extention;

	if (file_exists($file)) {
		$f = fopen($file, 'r');
	}
	else {
		die("File ".$file." not found");
	}
}
$content = fread($f, filesize($file));


$spoilerOpen = "<div class=\"spoiler\"><div class=\"title\" onclick=\"if (this.parentNode.getElementsByTagName('div')[1].getElementsByTagName('div')[0].style.display != '') {this.parentNode.getElementsByTagName('div')[1].getElementsByTagName('div')[0].style.display = '';this.innerText = '$4';}else {this.parentNode.getElementsByTagName('div')[1].getElementsByTagName('div')[0].style.display = 'none';this.innerText = '$3';}\">$3</div><div class=\"content\"><div style=\"display: none;\">";
$spoilerClose = "</div></div></div>";


$markdown = $Parsedown->text($content);

$markdown = preg_replace("/{(spoiler)\s+([^,]+?),([^,]+?),([^,]+?)}/", $spoilerOpen, $markdown);
$markdown = preg_replace("/{\/(spoiler)}/", $spoilerClose, $markdown);

echo $markdown;

fclose($f);
?>