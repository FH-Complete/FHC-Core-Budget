<?php

$headerarr = array(
	'FHComplete' => base_url('index.ci.php')
);

// Add Menu-Entry to Main Page
$config['navigation_menu']['Vilesci/index']['Administration']['children']['Budgetantrag'] = array(
	'link' => base_url('index.ci.php/extensions/FHC-Core-Budget/BudgetantragUebersicht'),
	'icon' => 'money',
	'description' => 'Budgetanträge',
	'expand' => false
);

// Add Header-Menu-Entry to Extension Page
$config['navigation_header']['extensions/FHC-Core-Budget/BudgetantragUebersicht/index'] = $headerarr;
$config['navigation_header']['extensions/FHC-Core-Budget/Budgetantrag/index'] = $headerarr;


$menuarr = array(
	'Budgetanträge Übersicht' => array(
		'link' => base_url('index.ci.php/extensions/FHC-Core-Budget/BudgetantragUebersicht'),
		'description' => 'Budgetanträge Übersicht',
		'icon' => 'bar-chart-o'//fa-list-alt
	),
	'Budgetanträge verwalten' => array(
		'link' => base_url('index.ci.php/extensions/FHC-Core-Budget/Budgetantrag'),
		'description' => 'Budgetanträge Verwaltung',
		'icon' => 'edit'
	)
);

// Add Menu-Entry to Extension Page
$config['navigation_menu']['extensions/FHC-Core-Budget/BudgetantragUebersicht/index'] = $menuarr;
$config['navigation_menu']['extensions/FHC-Core-Budget/Budgetantrag/index'] = $menuarr;
