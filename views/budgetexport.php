<?php
$this->load->view(
	'templates/FHC-Header',
	array(
		'title' => 'Budgetexport',
		'jquery' => true,
		'jqueryui' => true,
		'bootstrap' => true,
		'fontawesome' => true,
		'sbadmintemplate' => true,
		'dialoglib' => true,
		'ajaxlib' => true,
		'navigationwidget' => true,
		'jquerytreetable' => true,
		'customCSSs' =>
			array(
				'public/css/sbadmin2/admintemplate.css',
				'public/extensions/FHC-Core-Budget/css/budgetantraegeuebersicht.css'
			)
	)
);
?>

<body>
<div id="wrapper">
	<?php echo $this->widgetlib->widget('NavigationWidget'); ?>
	<div id="page-wrapper">
		<div class="container-fluid">
			<form method="post" action=" <?php echo site_url("/extensions/FHC-Core-Budget/Budgetexport/generateCSV");?>">
			<div class="row">
				<div class="col-lg-12">
					<h3 class="page-header">
						Budgetantr&auml;ge exportieren
					</h3>
				</div>
			</div>
			<div class="row">
				<div class="col-lg-7">
					<div class="row">
						<div class="col-lg-5">
							<div class="form-group" id="gjgroup">
								<label for="geschaeftsjahr">Geschäftsjahr</label>
								<select class="form-control" id="geschaeftsjahr" name="geschaeftsjahr">
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
							<div class="form-group">
								<label for="unternehmenstyp">Unternehmenstyp</label>
								<select class="form-control" id="unternehmenstyp" name="unternehmenstyp">
									<option value="null">Unternehmen wählen...</option>
									<option value="fh" selected>
										FH
									</option>
									<option value="gmbh">
										GMBH
									</option>
								</select>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-lg-7">
							<div class="row">
								<div class="col-lg-5">
						<input type="submit" class="btn btn-default" value="Budget Export SAP">
					</div>
				</div>
			</div>
			</form>
			<br /><br />
			<div class="row">
				<div class="col-lg-12">
				Hinweis: Das Format der Spalte Buchungsperiode muss auf "Text" geändert werden damit die führenden Nullen erhalten bleiben!
				</div>
			</div>
		</div> <!-- ./container-fluid -->
	</div> <!-- ./page-wrapper -->
</div> <!-- ./wrapper -->
</body>
