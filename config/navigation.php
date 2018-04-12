<?php

// Add Menu-Entry to Main Page
$config['navigation_menu']['Vilesci/index']['Administration']['children']['Budgetantrag'] = array(
	'link' => site_url('extensions/FHC-Core-Budget/BudgetantragUebersicht'),
	'icon' => 'money',
	'description' => 'Budgetanträge',
	'expand' => false
);

// Add Menu-Entry to Extension Page
$config['navigation_menu']['extensions/FHC-Core-Budget/*'] = array(
	'Budgetanträge Übersicht' => array(
		'link' => site_url('extensions/FHC-Core-Budget/BudgetantragUebersicht'),
		'description' => 'Budgetanträge Übersicht',
		'icon' => 'bar-chart-o'//fa-list-alt
	),
	'Budgetanträge verwalten' => array(
		'link' => site_url('extensions/FHC-Core-Budget/Budgetantrag'),
		'description' => 'Budgetanträge Verwaltung',
		'icon' => 'edit'
	)
);
