<?php
$this->load->view(
	'templates/FHC-Header',
	array(
		'title' => 'BudgetantraegeÜbersicht',
		'jquery' => true,
		'jqueryui' => true,
		'bootstrap' => true,
		'fontawesome' => true,
		'sbadmintemplate' => true,
		'tablesorter' => true,
		'dialoglib' => true,
		'ajaxlib' => true,
		'filterwidget' => true,
		'navigationwidget' => true,
		'phrases' => array(
			'ui' => array('bitteEintragWaehlen')
		),
		'customCSSs' =>
			array(
				'public/css/sbadmin2/tablesort_bootstrap.css'
			),
		'customJSs' => array('public/js/bootstrapper.js')
	)
);

?>
<body>
<div id="wrapper">
	<?php echo $this->widgetlib->widget('NavigationWidget'); ?>
	<div id="page-wrapper">
		<div class="container-fluid">
			<div class="row">
				<div class="col-lg-12">
					<h3 class="page-header">
						Budgetantr&auml;ge Statusübersicht
					</h3>
				</div>
			</div>
			<div>
				<?php $this->load->view('extensions/FHC-Core-Budget/budgetantraegestatusuebersichtdata.php'); ?>
			</div> <!-- ./main row -->
		</div> <!-- ./container-fluid -->
	</div> <!-- ./page-wrapper -->
</div> <!-- ./wrapper -->
</body>
<?php $this->load->view('templates/FHC-Footer'); ?>
