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
		'ajaxlib' => true,
		'navigationwidget' => true,
		'customCSSs' =>
			array(
				'public/css/sbadmin2/admintemplate.css'
			)
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
							Budgetantr&auml;ge Übersicht
						</h3>
					</div>
				</div>
				<div class="row">
					<iframe src="../../../addons/reports/cis/vorschau.php?statistik_kurzbz=BudgetplanungBerechtigt" width="100%" height="1000px" style="border:none">
					</iframe>
				</div>
			</div> <!-- ./container-fluid -->
		</div> <!-- ./page-wrapper -->
	</div> <!-- ./wrapper -->
</body>
<?php $this->load->view('templates/FHC-Footer'); ?>
