<?php
$this->load->view(
	'templates/FHC-Header',
	array(
		'title' => 'BudgetantraegeÜbersicht',
		'jquery3' => true,
		'jqueryui1' => true,
		'bootstrap3' => true,
		'fontawesome4' => true,
		'sbadmintemplate3' => true,
		'dialoglib' => true,
		'ajaxlib' => true,
		'navigationwidget' => true,
		'jquerytreetable3' => true,
		'customCSSs' =>
			array(
				'public/css/sbadmin2/admintemplate.css',
				'public/extensions/FHC-Core-Budget/css/budgetantraegeuebersicht.css'
			),
		'customJSs' =>
			array(
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
							Budgetantr&auml;ge Organisationsübersicht
						</h3>
					</div>
				</div>
				<div class="row">
					<div class="col-lg-7">
						<div class="form-group" id="gjgroup">
							<label>Suche</label>
							<div class="input-group">
								<span class="input-group-addon"><i class="fa fa-search"></i></span>
							<input type="text" class="form-control" id="budgetsearch" placeholder="Suchbegriff eingeben...">
							</div>
						</div>
					</div> <!-- ./first column -->
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
									<th>
										Organisationseinheit/Kostenstelle&nbsp;&nbsp;&nbsp;
										<button type="button" class="btn btn-default btn-xs" id="expall"><i class="fa fa-toggle-down"></i>&nbsp;&nbsp;&nbsp;alle aufklappen</button>
										<button type="button" class="btn btn-default btn-xs" id="collall"><i class="fa fa-toggle-up"></i>&nbsp;&nbsp;&nbsp;alle einklappen</button>
									</th>
									<th class="text-center">Budget gesamt (€ brutto)</th>
									<th class="text-center">Budget freigegeben (€ brutto)</th>
								</tr>
							</thead>
							<tbody>
							</tbody>
							<tfoot>
								<tr>
									<th>Gesamtsumme</th>
									<th class="text-center" id="summegesamt"></th>
									<th class="text-center" id="summefreigegeben"></th>
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
