<?php
$this->load->view(
	'templates/FHC-Header',
	array(
		'title' => 'BudgetantraegeÜbersicht',
		'jquery' => true,
		'bootstrap' => true,
		'fontawesome' => true,
		'sbadmintemplate' => true,
		'customCSSs' =>
			array(
				'public/css/sbadmin2/admintemplate.css',
				'vendor/ludo/jquery-treetable/css/jquery.treetable.css',
				'public/extensions/FHC-Core-Budget/css/budgetantraegeuebersicht.css'
			),
		'customJSs' =>
			array(
				'vendor/ludo/jquery-treetable/jquery.treetable.js',
				'public/extensions/FHC-Core-Budget/js/budgetantraegeUebersicht.js',
				'public/extensions/FHC-Core-Budget/js/budgetantraegeLib.js'
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
				<div class="col-lg-5">
					<div class="form-group" id="gjgroup">
						<label for="geschaeftsjahr">Geschäftsjahr</label>
						<select class="form-control" id="geschaeftsjahr">
							<option value="null">Geschäftsjahr wählen...</option>
							<?php
							foreach ($geschaeftsjahre as $geschaeftsjahr):
								$selected = $selectedgeschaeftsjahr === $geschaeftsjahr->geschaeftsjahr_kurzbz ? 'selected' : '';
								?>
								<option value="<?php echo $geschaeftsjahr->geschaeftsjahr_kurzbz; ?>" <?php echo $selected; ?>>
									<?php echo $geschaeftsjahr->geschaeftsjahr_kurzbz ?>
								</option>
							<?php endforeach; ?>
						</select>
					</div>
				</div> <!-- ./first column -->
			</div> <!-- ./main row -->
				<div class="row">
					<div class="col-lg-12">
						<table id ="ksttree" class="table table-bordered table-condensed ksttree">
							<thead>
								<tr>
									<th>Organisationseinheit/Kostenstelle</th>
									<th class="text-center">Budget gesamt (€ brutto)</th>
									<th class="text-center">Budget genehmigt (€ brutto)</th>
								</tr>
							</thead>
							<tbody>
							</tbody>
							<tfoot>
								<tr>
									<th>Gesamtsumme</th>
									<th class="text-center" id="summegesamt"></th>
									<th class="text-center" id="summegenehmigt"></th>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>
			</div> <!-- ./container-fluid -->
		</div> <!-- ./page-wrapper -->
	</div> <!-- ./wrapper -->
</body>
<?php $this->load->view('templates/FHC-Footer'); ?>