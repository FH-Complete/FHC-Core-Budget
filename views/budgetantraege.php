<?php
$this->load->view(
	'templates/FHC-Header',
	array(
		'title' => 'BudgetantraegeVerwalten',
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
				'public/extensions/FHC-Core-Budget/js/budgetantraegeAjax.js',
				'public/extensions/FHC-Core-Budget/js/budgetantraegeLib.js'
			)
	)
);
?>

<body>
<style>
	.form-horizontal .control-label{
		text-align: left;
	}
</style>
<div id="wrapper">
	<?php echo $this->widgetlib->widget('NavigationWidget'); ?>
	<div id="page-wrapper">
		<div class="container-fluid">
			<div class="row">
				<div class="col-lg-12">
					<h3 class="page-header">
						Budgetantr&auml;ge verwalten
					</h3>
				</div>
			</div>
			<div class="row">
				<div class="col-lg-7 form-horizontal">
					<div class="form-group row" id="gjgroup">
						<label for="geschaeftsjahr" class="col-lg-2 control-label">Geschäftsjahr</label>
						<div class="col-lg-10">
							<select class="form-control" id="geschaeftsjahr">
								<option value="null">Geschäftsjahr wählen...</option>
								<?php foreach ($geschaeftsjahre as $geschaeftsjahr): ?>
									<option value="<?php echo $geschaeftsjahr->geschaeftsjahr_kurzbz; ?>">
										<?php echo $geschaeftsjahr->geschaeftsjahr_kurzbz ?>
									</option>
								<?php endforeach; ?>
							</select>
						</div>
					</div>
					<div class="form-group row" id="kstgroup">
						<label for="kostenstelle" class="col-lg-2 control-label">Kostenstelle</label>
						<div class="col-lg-10">
							<select class="form-control" id="kostenstelle">
								<option value="null">Kostenstelle wählen...</option>
								<?php foreach ($kostenstellen as $kostenstelle): ?>
									<option value="<?php echo $kostenstelle->kostenstelle_id; ?>">
										<?php echo $kostenstelle->bezeichnung ?>
									</option>
								<?php endforeach; ?>
							</select>
						</div>
					</div>
				</div> <!-- ./first column -->
				<div class="col-lg-5">
					<table class="table table-bordered">
						<thead>
							<tr>
								<th>Gespeichert</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td id="savedSum">€ 0,00</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div> <!-- ./main row -->
			<br>
			<div class="row">
				<div class="col-lg-7">
					<div class="input-group" id="budgetbezgroup">
						<input type="text" class="form-control" id="budgetbezeichnung">
						<span class="input-group-btn">
						<button class="btn btn-default" id="addBudgetantrag">
							<i class="fa fa-plus"></i>
							Budgetantrag hinzufügen
						</button>
						</span>
					</div>
				</div>
			</div>
			<br><br>
			<div class="row">
				<div class="col-lg-12">
					<div class="panel-group" id="budgetantraege"></div>
				</div>
			</div>
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
