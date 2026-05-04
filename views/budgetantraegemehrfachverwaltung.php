<?php
$sitesettings = array(
	'title' => 'Budgetexport',
	'jquery3' => true,
	'jqueryui1' => true,
	'bootstrap3' => true,
	'fontawesome4' => true,
	'sbadmintemplate3' => true,
	'dialoglib' => true,
	'ajaxlib' => true,
	'navigationwidget' => true,
	'customCSSs' =>
		array(
			'public/extensions/FHC-Core-Budget/css/budgetantraegemehrfachverwaltung.css'
		)
);

$this->load->view(
	'templates/FHC-Header',
	$sitesettings
);
//var_dump($kostenstellen);
?>

<div id="wrapper">
	<?php echo $this->widgetlib->widget('NavigationWidget'); ?>
	<div id="page-wrapper">
		<div class="container-fluid">
			<div class="row">
				<div class="col-lg-12">
					<h3 class="page-header">
						Budgetantr&auml;ge Mehrfachverwaltung
					</h3>
				</div>
			</div>
			<div class="row">
				<form action="<?php echo site_url('extensions/FHC-Core-Budget/BudgetantragMehrfachverwaltung/changeBudget');?>" method="post">
				<div class="form-group form-inline">
					<div class="col-lg-4">
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
					<div class="col-lg-8" id ="kostenstellendropdown">
						<?php $this->load->view('extensions/FHC-Core-Budget/budgetkostenstelledropdown', ['defaultOptionText' => "Alle"]); ?>
					</div>
				</div>
			</div>
			<br />
			<br />
			<div class="row">
				<div class="col-lg-12 text-center">
					<input type="submit" class="btn btn-default" name="struktur" value="Initiale Budgetstruktur anlegen"></button>
					&nbsp;|&nbsp;
					<input type="submit" class="btn btn-default" name="neu" value="Budgetanträge auf 'Neu' setzen"></button>
					&nbsp;|&nbsp;
					<input type="submit" class="btn btn-default" name="abschicken" value="Budgetanträge abschicken"></button>
					&nbsp;|&nbsp;
					<input type="submit" class="btn btn-default" name="freigeben" value="Budgetanträge freigeben"></button>
				</div>
			</div>
				</form>
			<br />
			<br />
			<div class="row">
				<div class="col-lg-12">
					<div class="well well-sm wellminheight">
						<h4 class="text-center">Output:</h4>
						<div id="applicationsyncoutput" class="panel panel-body">
							<div id="applicationsyncoutputheading" class="text-center"></div>
							<div id="applicationsyncoutputtext" class="text-center">
								<?php echo is_array($output) ? implode('<br />', $output) : ($output ?? '-') ?>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div> <!-- ./container-fluid -->
	</div> <!-- ./page-wrapper -->
</div> <!-- ./wrapper -->
<?php

$this->load->view(
	'templates/FHC-Footer',
	$sitesettings
);
