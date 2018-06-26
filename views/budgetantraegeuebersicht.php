<?php
$this->load->view(
	'templates/FHC-Header',
	array(
		'title' => 'BudgetantraegeÜbersicht',
		'jquery' => true,
		'bootstrap' => true,
		'fontawesome' => true,
		'sbadmintemplate' => true,
		'ajaxlib' => true,
		'navigationwidget' => true,
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
				<div class="col-lg-6 col-lg-offset-1">
					<div class="form-group" id="gjgroup">
							<label for="budgetsearch">Suche</label>&nbsp;
							<div class="btn-group">
									<button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown">
										<span id="searchmode">KST</span>
										<span class="caret"></span>
									</button>
								<ul class="dropdown-menu" role="menu">
									<li><a id="searchmodekst" href="javascript:void(0)">Kostenstelle</a>
									</li>
									<li><a id="searchmodeoe" href="javascript:void(0)">Organisationseinheit</a>
									</li>
								</ul>
							</div>
						<div class="input-group">
							<span class="input-group-addon"><i class="fa fa-search"></i></span>
						<input type="text" class="form-control" id="budgetsearch" placeholder="Suchbegriff eingeben...">
						</div>
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
										<button type="button" class="btn btn-default btn-xs" id="expall"><i class="fa fa-toggle-down"></i>&nbsp;&nbsp;&nbsp;expand all</button>
										<button type="button" class="btn btn-default btn-xs" id="collall"><i class="fa fa-toggle-up"></i>&nbsp;&nbsp;&nbsp;collapse all</button>
									</th>
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