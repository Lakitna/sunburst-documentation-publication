<!DOCTYPE html>
<html>
<head>
	<link rel="stylesheet" type="text/css" href="../css/style.css">

	<style>
		.button {
			border-radius: 1em;
			/* background: rgba(0,200,83,.2); */
			background: rgba(0,0,0,.1);
			text-align: center;
		}

		.button:hover {
			background: rgba(0,255,0,.2);
			/* background: rgba(0,0,0,.05); */
			cursor: pointer;
		}

		.button a {
			padding: 2em 0;
  			font-family: 'PT Sans', sans-serif;
			color: #000 !important;
			text-decoration: none;
			width: 100%;
			height: 100%;
			display: block;
		}

		.button a:after {
			content: "";
		}

		.markdown > * {
			width: 50% !important;
			max-width: 530px;
		}
	</style>
</head>
<body>

<article class="markdown">

	<h1>Unable to open link in frame</h1>

	<p class="button">
		<a target="_blank" href="<?php echo $_GET['url']; ?>">Open in new tab instead</a>
	</p>

<!-- 	<p style="font-size: 70%; margin-top: 8em !important;">
		The site you tried to reach has blocked loading within a frame like this to prevent clickjacking. It's very annoying.
	</p>
 --></article>

</body>
</html>