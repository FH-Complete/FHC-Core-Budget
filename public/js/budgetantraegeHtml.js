var BudgetantraegeHtml = {
	/**
	 * Gets html placed before the Budgetanträge panels
	 * @returns {string}
	 */
	getPreBudgetantragHtml: function()
	{
		var html = '<div class="row">';

		if (BudgetantraegeController.global_booleans.editmode === true)
			html += '<div class="col-lg-7 col-xs-12">'+
						'<div class="form-group input-group" id="budgetbezgroup">'+
							'<input type="text" class="form-control" id="budgetbezeichnung" placeholder="Budgetantragsbezeichnung eingeben">'+
							'<span class="input-group-btn">'+
								'<button class="btn btn-default" id="addBudgetantrag">'+
								'<i class="fa fa-plus"></i>&nbsp;Budgetantrag hinzufügen'+
								'</button>'+
							'</span>'+
						'</div>'+
					'</div>';

			html += '<div class="col-lg-5 col-xs-12">'+
						'<table class="table table-bordered table-condensed text-center" id="sumtable">'+
							'<tbody>'+
								'<tr>'+
									'<td><strong>Budgetsumme: </strong><span id="savedSum">€ 0,00</span></td>'+
								'</tr>'+
							'</tbody>'+
						'</table>'+
					'</div>'+
					'<br><br>'+
				'</div>'+
				'<div class="row">'+
					'<div class="col-xs-12">'+
					'<div class="panel-group" id="budgetantraege"></div></div>'+
				'</div>';

		return html;
	},

	/**
	 * Gets the html for a Budgetantrag, filling it with Budgetantrag data
	 * @param args the Budgetantrag data, but also other formatting data
	 * @param editable wether Budgetantrag is editable or readonly
	 * @returns {string} html string
	 */
	getBudgetantragHtml: function(args, editable)
	{
		var html = '<div class="panel-heading">'+
					'<div class="row">'+
						'<div class="col-xs-5 form-inline">'+
							'<h4 class="panel-title">'+
							'<a class="accordion-toggle'+args.collapseHtml+' arrowcollapse" data-toggle="collapse" data-parent="#budgetantraege" href="#collapse'+args.budgetantragid+'">'+
							'<span id="budgetbezeichnung_'+args.budgetantragid+'">'+args.budgetname+'</span>&nbsp;'+
							'</a>';

		if (editable === true)
			html += 		'<i id="budgetbezedit_'+args.budgetantragid+'" class="fa fa-edit budgetbezedit"></i>';

			html += 		'<div class="form-group input-group" id="budgetbezinputgrp_'+args.budgetantragid+'" style="display:none">'+
								'<input class="form-control budgetbezinput" id="budgetbezinput_'+args.budgetantragid+'">'+
								'<span class="input-group-btn"><button class="btn btn-default budgetbezconfirm" type="button" id="budgetbezconfirm_'+args.budgetantragid+'"><i class="fa fa-check"></i></button></span>'+
							'</div>'+
							'&nbsp;&nbsp;|&nbsp;'+
							'<a class="accordion-toggle'+args.collapseHtml+'" data-toggle="collapse" data-parent="#budgetantraege" href="#collapse'+args.budgetantragid+'">'+
								'<span id="budgetstatus_'+args.budgetantragid+'"></span>'+
								'<span id="unsaved_'+args.budgetantragid+'" class="hidden">&nbsp;&nbsp;<i class="glyphicon glyphicon-floppy-remove text-danger"></i></span>'+
							'</a>'+
							'</h4>'+
						'</div>'+
						'<div class="col-xs-2 text-center">' +
							'<span id = "sum_'+args.budgetantragid+'"></span>' +
						'</div>'+
	/*					'<div class="col-lg-2 col-lg-offset-2 col-sm-3 col-sm-offset-1 text-right">Budgetantrag</div>'+*/
						'<div class="col-xs-1 col-xs-offset-4 text-right">';

		if (editable === true)
			html += 		'<i class="fa fa-times text-danger" id="remove_'+args.budgetantragid+'" role="button"></i>';

			html +=		'</div>'+
					'</div>'+
				'</div>'+//panel-heading
				'<div id="collapse'+args.budgetantragid+'" class="panel-collapse collapse'+args.collapseInHtml+'">'+
					'<div class="panel-body form-horizontal">'+
						'<div class="row">' +
							'<div class="col-xs-2 col-xs-offset-5 budgetpostenheading text-center">'+
								'Budgetposten:<br>'+
							'</div>'+
							'<div class="col-xs-5 text-right budgetpostenheading text-right">'+
							'<span class="asterisklegend">*</span> Pflichtfelder<br>'+
							'</div>'+
						'</div>'+
						'<div id="budgetPosition_'+args.budgetantragid+'" class="panel-group"></div>';

		if (editable === true)
			html += 	'<div class="row">'+
							'<div class="col-xs-12">'+
								'<button class="btn btn-default" id="addPosition_'+args.budgetantragid+'">'+
								'<i class="fa fa-plus"></i>&nbsp;'+
								'Budgetposten hinzufügen'+
								'</button>'+
							'</div>'+
						'</div>';

			html +=	'</div>'+//panel-body
					'<div class="panel-footer" id="budgetfooter_'+args.budgetantragid+'"></div>'+//panel-footer
				'</div>';//collapse item

		return html;
	},

	/**
	 * Gets html for footer of a Budgetantrag (different depending if its a new or existent Budgetantrag)
	 * @param args
	 * @param editable wether Budgetantrag is editable or readonly
	 * @returns {string}
	 */
	getBudgetantragFooterHtml: function(args, editable)
	{
		if (editable === false)
		{
			return '<div class="row">'+
						'<div class="col-lg-2 col-lg-offset-5 text-center antragMsg" id="msg_'+args.budgetantragid+'"></div>'+
					'</div>';
		}

		var saveBtnHtml = '<button class="btn btn-default" id="save_'+args.budgetantragid+'">'+
			'<i class="glyphicon glyphicon-floppy-disk"></i>&nbsp;'+
			'<span>Speichern</span>'+
			'</button>';

		var freigebenBtnHtml = '<button class="btn btn-default" id="freigeben_'+args.budgetantragid+'">' +
			'<i class="glyphicon glyphicon-ok"></i>&nbsp;'+
			'Freigeben' +
			'</button>&nbsp;&nbsp;';

		var ablehnenBtnHtml = '<button class="btn btn-default" id="ablehnen_'+args.budgetantragid+'">' +
			'<i class="glyphicon glyphicon-remove"></i>&nbsp;'+
			'Ablehnen' +
			'</button>';

		var html = '';

		if (args.isNewAntrag === true)
		{
			html +=
				'<div class="row">'+
					'<div class="col-lg-2 col-lg-offset-5 text-center antragMsg" id="msg_'+args.budgetantragid+'">'+
					'</div>'+
					'<div class="col-lg-5 text-right">'+
						saveBtnHtml+
					'</div>'+
				'</div>';
		}
		else
		{
			html +=
				'<div class="row">'+
					'<div class="col-lg-5">';

			if (BudgetantraegeController.global_booleans.freigebbar === true)
				html += freigebenBtnHtml + ablehnenBtnHtml;

				html +=
					'</div>'+
					'<div class="col-lg-2 text-center antragMsg" id="msg_'+args.budgetantragid+'">'+
					'</div>'+
					'<div class="col-lg-5 text-right">'+
						saveBtnHtml+'&nbsp;&nbsp;'+
						'<button class="btn btn-default" id="abschicken_'+args.budgetantragid+'">' +
							'<i class="fa fa-envelope"></i>&nbsp;'+
							'Abschicken' +
						'</button>' +
					'</div>'+
				'</div>';
		}

		return html;
	},

	/**
	 * Gets Html for a Budgetposition
	 * @param args
	 * @param editable wether Budgetantrag is editable or readonly
	 * @returns {string}
	 */
	getBudgetpositionHtml: function(args, editable)
	{
		var disabled = editable === true ? '' : 'disabled=""';

		var kontooptionshtml = '', selectedKontoKurzbz = '&nbsp;';
		var betrag = BudgetantraegeLib.formatDecimalGerman(args.betrag);
		var betragWithCrncy = betrag ? '€ '+betrag : '€ 0,00';

		//get konto
		for (var i = 0; i < BudgetantraegeController.global_preloads.konten.length; i++)
		{
			var konto = BudgetantraegeController.global_preloads.konten[i];
			var selected = '';

			if (args.konto_id === konto.konto_id)
			{
				selected = ' selected=""';
				selectedKontoKurzbz = ' | Konto '+konto.kurzbz;
			}

			var kurzbz = konto.kurzbz + " (" + konto.kontonr + ")";
			var inactivehtml = '';

			//mark if inactive
			if (konto.aktiv === false)
			{
				kurzbz += " (inaktiv)";
				inactivehtml = 'class = "inactiveoption"';
			}

			kontooptionshtml += '<option value="' + konto.konto_id + '" '+inactivehtml+ ' ' + selected + '>' + kurzbz + '</option>';
		}

		var html =
			'<div class="panel panel-default" id="'+POSITION_PREFIX+'_'+args.positionid+'">'+
				'<div class="panel-heading">' +
					'<div class="row">'+
							'<a class="accordion-toggle'+args.collapseHtml+'" data-toggle="collapse" href="#collapsePosition'+args.positionid+'">'+
								'<div class="col-xs-5">'+
									args.budgetposten+selectedKontoKurzbz+
								'</div>'+
								'<div class="col-xs-2 text-center"> '+betragWithCrncy+'</div>'+
								'<div class="col-xs-3">&nbsp;</div>'+
							'</a>'+
						'<div class="col-xs-2 text-right">';

		if (editable === true)
			html +=			'<i class="fa fa-times text-danger" id="removePosition_'+args.positionid+'" role="button"></i>';

		html += 		'</div>'+
					'</div>'+
				'</div>'+//panel-heading
			'<div class="panel-collapse collapse'+args.collapseInHtml+'" id="collapsePosition'+args.positionid+'">';

		html +=
			'<div class="panel-body">'+
			'<form id="form_'+args.positionid+'">'+
			'<div class="row">'+
				'<div class="col-lg-6">'+
					'<div class="form-group row">'+
						'<label class="col-lg-4 control-label label-required">Bezeichnung</label>'+
						'<div class="col-lg-8">'+
							'<input type="text" class="form-control" name="budgetposten" value="'+args.budgetposten+'" '+disabled+'>'+
						'</div>'+
					'</div>'+
				'</div>'+
				'<div class="col-lg-5">'+
					'<div class="form-group row">'+
						'<label class="col-lg-4 control-label">Projekt</label>'+
						'<div class="col-lg-8">'+
							'<select class="form-control" name="projekt_id" '+disabled+'>'+
								'<option value="null">Projekt wählen...</option>';

		for (var j = 0; j < BudgetantraegeController.global_preloads.projekte.length; j++)
		{
			var projekt = BudgetantraegeController.global_preloads.projekte[j];
			var selected = args.projekt_id === projekt.projekt_id ? ' selected=""' : '';
			html += '<option value="' + projekt.projekt_id + '"' + selected + '>' + projekt.titel + '</option>';
		}

		html +=
							'</select>'+
						'</div>'+
					'</div>'+
				'</div>'+ //column
			'</div>'+//row
			'<div class="row">'+
				'<div class="col-lg-6">'+
					'<div class="form-group row">'+
						'<label class="col-lg-4 control-label label-required">Konto</label>'+
						'<div class="col-lg-8">'+
							'<select class="form-control" name="konto_id" '+disabled+'>'+
								'<option value="null">Konto wählen...</option>';

		html += kontooptionshtml;

		html +=
							'</select>'+
						'</div>'+
					'</div>'+
				'</div>'+
				'<div class="col-lg-5">'+
					'<div class="form-group row">'+
						'<label class="col-lg-4 control-label label-required">Bruttobetrag</label>'+
						'<div class="col-lg-8">'+
							'<div class="input-group">'+
								'<span class = "input-group-addon">'+
									'<i class="fa fa-eur"></i>'+
								'</span>'+
								'<input type="text" class="form-control" name="betrag" value="'+betrag+'" placeholder="0,00"'+disabled+'>'+
							'</div>'+//input-group
						'</div>'+//column
					'</div>'+//form-group row
				'</div>'+//column
			'</div>'+//row
			'<div class="form-group row">'+
				'<label class="col-lg-2 control-label">Beschreibung</label>'+
				'<div class="col-lg-9">'+
					'<textarea class="form-control" name="kommentar" '+disabled+'>'+args.kommentar+'</textarea>'+
				'</div>'+
			'</div>'+
			'</form>'+
			'</div>'+// ./panel-body
			'</div>';// ./panel-collapse

		return html;
	},

	/**
	 * Return bodytext for modal for changing Budgetantrag to sent
	 * @returns {string}
	 */
	getModalSentHtml: function ()
	{
		return '<p>Der Status des Antrags wird auf <i class="frgAdj"></i> gesetzt. '+
			//Die Verantwortlichen erhalten eine Benachrichtigungsmail, damit der Antrag freigegeben werden kann. '+
			'Der Antrag kann jedoch noch bearbeitet werden.</p>'+
			'<p>Alle nicht gespeicherten Daten gehen verloren. Bist du sicher, dass du den Budgetantrag <span class="frgVerb"></span> m&ouml;chtest?</p>';
	},

	/**
	 * Return bodytext for modal for changing Budgetantrag to approved
	 * @returns {string}
	 */
	getModalApprovedHtml: function()
	{
		return '<p>Der Status des Antrags wird auf <i class="frgAdj"></i> gesetzt, der Antrag kann nicht mehr bearbeitet werden.</p>'+
			'<p>Alle nicht gespeicherten Daten gehen verloren. Bist du sicher, dass du den Budgetantrag <span class="frgVerb"></span> m&ouml;chtest?</p>';
	}
};
