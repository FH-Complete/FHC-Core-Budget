<?php

$query = 'SELECT budgetantrag_id, tbl_budget_antrag.bezeichnung AS "Budgetantrag", tbl_kostenstelle.kostenstelle_id, tbl_kostenstelle.bezeichnung AS "Kostenstelle",
  tbl_kostenstelle.oe_kurzbz AS "Organisationseinheit", tbl_budget_antrag.geschaeftsjahr_kurzbz AS "Geschäftsjahr",
   (SELECT tbl_budget_status.bezeichnung
  	FROM extension.tbl_budget_antrag_status 
  	JOIN extension.tbl_budget_status USING (budgetstatus_kurzbz)
  	WHERE tbl_budget_antrag_status.budgetantrag_id = tbl_budget_antrag.budgetantrag_id
  	ORDER BY datum DESC
  	LIMIT 1
  	) AS "Budgetstatus",
   (SELECT SUM(betrag)
	FROM extension.tbl_budget_position
	WHERE tbl_budget_position.budgetantrag_id = tbl_budget_antrag.budgetantrag_id
	) AS "Betrag"
	FROM extension.tbl_budget_antrag
	JOIN wawi.tbl_kostenstelle USING (kostenstelle_id)
	WHERE tbl_budget_antrag.kostenstelle_id IN ('.$kostenstellenberechtigt.')
	ORDER BY geschaeftsjahr_kurzbz DESC, "Kostenstelle", "Organisationseinheit", "Budgetstatus", "Budgetantrag"';

$filterWidgetArray = array(
	'query' => $query,
	'app' => 'budget',
	'datasetName' => 'budgetoverview',
	'filterKurzbz' => 'BudgetUebersicht',
	'filter_id' => $this->input->get('filter_id'),
	'requiredPermissions' => 'extension/budget_verwaltung',
	'datasetRepresentation' => 'tablesorter',
	'customMenu' => true,
	'additionalColumns' => array('Details'),
	'columnsAliases' => array(
		'BudgetantragID',
		'Budgetantrag',
		'KostenstelleID',
		'Kostenstelle',
		'Organisationseinheit',
		'Geschäftsjahr',
		'Budgetstatus',
		'Betrag (€ brutto)'
	),
	'formatRow' => function($datasetRaw) {

		$datasetRaw->{'Details'} = sprintf(
			'<a href="%s?geschaeftsjahr=%s&kostenstelle_id=%s&budgetantrag_id=%s">Details</a>',
			site_url('extensions/FHC-Core-Budget/Budgetantrag/showVerwalten'),
			$datasetRaw->{'Geschäftsjahr'},
			$datasetRaw->{'kostenstelle_id'},
			$datasetRaw->{'budgetantrag_id'}
		);

		//german currency format
		$datasetRaw->{'Betrag'} = number_format(floatval($datasetRaw->{'Betrag'}), 2, ",", "");

		if ($datasetRaw->{'Organisationseinheit'} == null)
		{
			$datasetRaw->{'Organisationseinheit'} = '-';
		}

		if ($datasetRaw->{'Budgetantrag'} == null)
		{
			$datasetRaw->{'Budgetantrag'} = '-';
		}

		return $datasetRaw;
	}
);

echo $this->widgetlib->widget('FilterWidget', $filterWidgetArray);
