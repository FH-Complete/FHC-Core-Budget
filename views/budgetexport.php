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
			<div class="row align-items-center">
				<div class="col-lg-12 align-items-center">
					<form method="post" action=" <?php echo site_url("/extensions/FHC-Core-Budget/Budgetexport/generateCSV");?>">
                        <div class="form-group">
				            <input type="submit" value="download CSV">
                        </div>
                    </form>
			    </div>

            </div>
		</div> <!-- ./container-fluid -->
	</div> <!-- ./page-wrapper -->
</div> <!-- ./wrapper -->
</body>
