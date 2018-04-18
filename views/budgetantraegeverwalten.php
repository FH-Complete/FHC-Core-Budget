<?php
$this->load->view(
	'templates/FHC-Header',
	array(
		'title' => 'BudgetantraegeVerwaltung',
		'jquery' => true,
		'bootstrap' => true,
		'fontawesome' => true,
		'sbadmintemplate' => true,
		'customCSSs' =>
			array(
				'skin/admintemplate.css'
			),
		'customJSs' =>
			array(
				'public/extensions/FHC-Core-Budget/js/budgetantraegeController.js',
				'public/extensions/FHC-Core-Budget/js/budgetantraegeView.js',
				'public/extensions/FHC-Core-Budget/js/budgetantraegeHtml.js',
				'public/extensions/FHC-Core-Budget/js/budgetantraegeAjax.js',
				'public/extensions/FHC-Core-Budget/js/budgetantraegeLib.js'
			)
	)
);
?>
<body>
<?php
	echo '<script type="text/javascript">';
	echo 'var BASE_URL = "'.base_url().'";';
	echo "</script>\n";
?>
<div id="wrapper">
	<?php echo $this->widgetlib->widget('NavigationWidget'); ?>
	<div id="page-wrapper">
		<div class="container-fluid">
			<div class="row">
				<div class="col-lg-12">
					<h3 class="page-header">
						Budgetantr&auml;ge Verwaltung
					</h3>
				</div>
			</div>
			<div class="row">
				<div class="col-lg-7">
					<div class="row">
						<div class="col-lg-5">
							<div class="form-group" id="gjgroup">
								<label for="geschaeftsjahr">Geschäftsjahr</label>
								<select class="form-control" id="geschaeftsjahr">
									<option value="null">Geschäftsjahr wählen...</option>
									<?php
									$firstelement = reset($geschaeftsjahre);
									foreach ($geschaeftsjahre as $geschaeftsjahr):
										$selected = $firstelement->geschaeftsjahr_kurzbz === $geschaeftsjahr->geschaeftsjahr_kurzbz ? 'selected' : '';
										?>
										<option value="<?php echo $geschaeftsjahr->geschaeftsjahr_kurzbz; ?>" <?php echo $selected; ?>>
											<?php echo $geschaeftsjahr->geschaeftsjahr_kurzbz ?>
										</option>
									<?php endforeach; ?>
								</select>
							</div>
						</div>
						<div class="col-lg-7">
							<div class="form-group" id="kstgroup">
								<label for="kostenstelle">Kostenstelle</label>
								<select class="form-control" id="kostenstelle">
									<option value="null">Kostenstelle wählen...</option>
									<?php
									foreach ($kostenstellen as $kostenstelle):
										?>
										<option value="<?php echo $kostenstelle->kostenstelle_id; ?>">
											<?php echo $kostenstelle->bezeichnung ?>
										</option>
									<?php endforeach; ?>
								</select>
							</div>
						</div>
					</div>
				</div> <!-- ./first column -->
			</div> <!-- ./main row -->
			<br>
			<div id="budgetantraegehtml"></div>
			<!-- modal for deleting of a budgetantrag -->
			<div id="delAntragModal" class="modal fade">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
							<h4 class="modal-title">Budgetantrag l&ouml;schen</h4>
							</div>
						<div class="modal-body">
							<p>Sind Sie sicher, dass Sie den Budgetantrag <span id="delBudgetantragBez"></span> l&ouml;schen m&ouml;chten?</p>
							</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-default" data-dismiss="modal">Abbrechen</button>
							<button type="button" class="btn btn-primary" id="delModalConfirm">Budgetantrag l&ouml;schen</button>
						</div>
					</div>
				</div>
			</div>
		</div> <!-- ./container-fluid -->
	</div> <!-- ./page-wrapper -->
</div> <!-- ./wrapper -->