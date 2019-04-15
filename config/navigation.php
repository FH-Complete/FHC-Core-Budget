<?php

$config['navigation_header']['*']['Organisation']['children']['Budgetantrag'] = array(
	'link' => site_url('extensions/FHC-Core-Budget/BudgetantragUebersicht'),
	'sort' => 25,
	'description' => 'Budgetverwaltung',
	'expand' => false,
	'requiredPermissions' => 'extension/budget_verwaltung:r'
);

// Add Menu-Entry to Extension Page
$config['navigation_menu']['extensions/FHC-Core-Budget/*'] = array(
	'Budgetanträge Übersicht' => array(
		'link' => site_url('extensions/FHC-Core-Budget/BudgetantragUebersicht'),
		'description' => 'Budgetanträge Statusübersicht',
		'icon' => 'navicon'
	),
	'Budgetanträge OE Übersicht' => array(
		'link' => site_url('extensions/FHC-Core-Budget/BudgetantragUebersicht/oeUebersicht'),
		'description' => 'Budgetanträge Organisationsübersicht',
		'icon' => 'sitemap'
	),
	'Budgetanträge verwalten' => array(
		'link' => site_url('extensions/FHC-Core-Budget/Budgetantrag'),
		'description' => 'Budgetanträge Verwaltung',
		'icon' => 'edit'
	)
);
