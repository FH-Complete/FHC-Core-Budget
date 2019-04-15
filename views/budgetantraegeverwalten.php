<?php
$this->load->view(
	'templates/FHC-Header',
	array(
		'title' => 'BudgetantraegeVerwaltung',
		'jquery' => true,
		'bootstrap' => true,
		'fontawesome' => true,
		'sbadmintemplate' => true,
		'dialoglib' => true,
		'ajaxlib' => true,
		'navigationwidget' => true,
		'customCSSs' =>
			array(
				'public/css/sbadmin2/admintemplate.css',
				'public/extensions/FHC-Core-Budget/css/budgetantraegeverwalten.css'
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
										foreach ($geschaeftsjahre as $geschaeftsjahr):
											$selected = $selectedgeschaeftsjahr === $geschaeftsjahr->geschaeftsjahr_kurzbz ? 'selected' : '';
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
											$selected = $selectedkostenstelle === $kostenstelle->kostenstelle_id ? ' selected' : '';
											$inactivetext = $kostenstelle->aktiv === false ? ' (inaktiv)' : '';
											$inactiveclass = $kostenstelle->aktiv === false ? ' class = "inactiveoption"' : '';
											if (is_numeric($kostenstelle->kostenstelle_id)):
											?>
												<option value="<?php echo $kostenstelle->kostenstelle_id; ?>"<?php echo $inactiveclass; ?><?php echo $selected; ?>>
													<?php echo $kostenstelle->bezeichnung.$inactivetext; ?>
												</option>
											<?php endif; ?>
										<?php endforeach; ?>
									</select>
								</div>
							</div>
						</div>
					</div> <!-- ./first column -->
				</div> <!-- ./main row -->
				<input type="hidden" id="budgetantrag_id" value="<?php echo $budgetantrag_id ?>">
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
								<p>Bist du sicher, dass du den Budgetantrag <span id="delBudgetantragBez"></span> l&ouml;schen m&ouml;chtest?</p>
								</div>
							<div class="modal-footer">
								<button type="button" class="btn btn-default" data-dismiss="modal">Abbrechen</button>
								<button type="button" class="btn btn-primary" id="delModalConfirm">Budgetantrag l&ouml;schen</button>
							</div>
						</div>
					</div>
				</div>
				<!-- modal for freigeben/ablehnen of a budgetantrag -->
				<div id="frgAntragModal" class="modal fade">
					<div class="modal-dialog">
						<div class="modal-content">
							<div class="modal-header">
								<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
								<h4 class="modal-title">Budgetantrag <span class="frgVerb"></span></h4>
							</div>
							<div class="modal-body">
								<p>Der Status des Antrags wird auf <i class="frgAdj"></i> gesetzt, der Antrag kann nicht mehr bearbeitet werden.</p>
								<p>Alle nicht gespeicherten Daten gehen verloren. Bist du sicher, dass du den Budgetantrag <span class="frgVerb"></span> m&ouml;chtest?</p>
							</div>
							<div class="modal-footer">
								<button type="button" class="btn btn-default" data-dismiss="modal">Abbrechen</button>
								<button type="button" class="btn btn-primary" id="frgModalConfirm">Budgetantrag <span class="frgVerb"></span></button>
							</div>
						</div>
					</div>
				</div>
			</div> <!-- ./container-fluid -->
		</div> <!-- ./page-wrapper -->
	</div> <!-- ./wrapper -->
</body>
<?php $this->load->view('templates/FHC-Footer'); ?>
