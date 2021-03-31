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
									'<td><strong>Erlösesumme: </strong><span id="erloeseSavedSum">€ 0,00</span></td>'+
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
							'<a class="accordion-toggle'+args.collapseHtml+'" data-toggle="collapse" data-parent="#budgetantraege" href="#collapse'+args.budgetantragid+'">'+
							'&nbsp;|&nbsp;'+
								'<span id="budgetstatus_'+args.budgetantragid+'"></span>'+
								'<span id="unsaved_'+args.budgetantragid+'" class="hidden">&nbsp;&nbsp;<i class="glyphicon glyphicon-floppy-remove text-danger"></i></span>'+
							'</h4>'+
						'</div>'+
						'<div class="col-xs-3 text-center">' +
							'<span>' +
								'<span>Betrag: </span>' +
								'<span id="sum_'+args.budgetantragid+'"></span>' +
								'<span> | </span>' +
								'<span>Erlöse: </span>' +
								'<span id="erloeseSum_'+args.budgetantragid+'"></span>' +
							'</span>' +
						'</div>'+
						'<div class="col-xs-2 col-xs-offset-2 text-right">' +
							'</a>';

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
		var html = '';

		if (editable === false)
		{
			html += '<div class="row">';

			var coloffset = " col-lg-offset-5";

			if (args.freigabeAufhebenBtn === true && BudgetantraegeController.global_booleans.freigebbar === true)
			{
				html += '<div class="col-lg-5">'+
							'<button class="btn btn-default" id="revertfreigabe_'+args.budgetantragid+'">'+
								'<i class="fa fa-undo"></i>&nbsp;'+
								'<span>Freigabe aufheben</span>'+
							'</button>'+
						'</div>';
				coloffset = "";
			}

			html += '<div class="col-lg-2'+coloffset+' text-center antragMsg" id="msg_'+args.budgetantragid+'"></div>';
			html += '</div>';

			return html;
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
		var erloeseWithCrncy = '€ 0,00';
		var betragDisabled = '';

		var jahrverteilenchecked = '';
		var datefieldhidden = '';

		var investition_checked = '';
		var nutzungsdauer_hidden = 'hidden';

		var erloese_checked = '';

		// null means NULL in database (Betrag ist auf Jahr verteilt)
		// string 'null' means new budgetposition (still show empty datefield)
		if (args.benoetigt_am === null)
		{
			jahrverteilenchecked = ' checked="checked"';
			datefieldhidden = ' hidden';
		}
		var benoetigt_am = args.benoetigt_am !== null && args.benoetigt_am !== 'null' ? BudgetantraegeLib.formatDateGerman(args.benoetigt_am) : '';

		// erloese
		if (args.erloese === true)
		{
			erloese_checked = ' checked="checked"';
			betragWithCrncy = '€ 0,00';
			betragDisabled = ' disabled';
			erloeseWithCrncy = betrag ? '€ '+betrag : '€ 0,00';
		}

		// investition
		if (args.investition === true)
		{
			investition_checked = ' checked="checked"';
			nutzungsdauer_hidden = '';
		}

		// Get konto
		for (var i = 0; i < BudgetantraegeController.global_preloads.konten.length; i++)
		{
			var konto = BudgetantraegeController.global_preloads.konten[i];
			var selected = '';

			if (args.konto_id === konto.konto_id)
			{
				selected = ' selected=""';
				selectedKontoKurzbz = ' | Kontokategorie '+konto.kurzbz;
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
			'<div class="panel panel-default budgetpositioncollapse" id="'+POSITION_PREFIX+'_'+args.positionid+'">'+
				'<div class="panel-heading">' +
					'<div class="row">'+
							'<a class="accordion-toggle'+args.collapseHtml+'" data-toggle="collapse" href="#collapsePosition'+args.positionid+'">'+
								'<div class="col-xs-5">'+
									args.budgetposten+selectedKontoKurzbz+
								'</div>'+
								'<div class="col-xs-3 text-center">'+
									'<span>'+
										'Betrag: '+
									'</span>'+
									'<span id="betragWithCrncy_'+args.positionid+'">'+
										betragWithCrncy+
									'</span>'+
								'</div>'+
								'<div class="col-xs-2 text-center">'+
									'<span>'+
										'Erlöse: '+
									'</span>'+
									'<span id="erloeseWithCrncy_'+args.positionid+'">'+
										erloeseWithCrncy+
									'</span>'+
								'</div>'+
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
						'<label class="col-lg-4 control-label label-required">Kontokategorie</label>'+
						'<div class="col-lg-8">'+
							'<select class="form-control" name="konto_id" '+disabled+'>'+
								'<option value="null">Kontokategorie wählen...</option>';

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
								'<input type="text" class="form-control" id="betrag_'+args.positionid+'" name="betrag" value="'+betrag+'" placeholder="0,00" '+disabled+' '+betragDisabled+'>'+
							'</div>'+//input-group
						'</div>'+//column
					'</div>'+//form-group row
				'</div>'+//column
			'</div>'+//row

			'<div class="row">'+
				'<div class="col-lg-6">'+
					'<div class="form-group row">'+
						'<label class="col-lg-4 control-label">Investition</label>'+
						'<div class="col-lg-8">'+
			 				'<div class="input-group">'+
								'<label class="checkbox-inline control-label">'+
									'<input type="checkbox" name="investition" id="investition_'+args.positionid+'"'+disabled+investition_checked+'>'+
								'</label>'+
							'</div>'+//form-group row
						'</div>'+//column
					'</div>'+//form-group row
				'</div>'+
				'<div class="col-lg-5">'+
					'<div class="form-group row">'+
						'<label class="col-lg-4 control-label">Erlöse</label>'+
						'<div class="col-lg-8">'+
			 				'<div class="input-group">'+
								'<label class="checkbox-inline control-label">'+
									'<input type="checkbox" name="erloese" id="erloese_'+args.positionid+'"'+disabled+erloese_checked+'>'+
								'</label>'+
							'</div>'+//form-group row
						'</div>'+//column
					'</div>'+//form-group row
				'</div>'+
			'</div>'+//row

			'<div class="row '+nutzungsdauer_hidden+'" id="nutzungsdauer_group_'+args.positionid+'">'+
				'<div class="col-lg-6">'+
					'<div class="form-group row">'+
						'<label class="col-lg-4 control-label">Nutzungsdauer</label>'+
						'<div class="col-lg-2">'+
							'<div class="input-group">'+
								'<input type="number" class="form-control" name="nutzungsdauer" id="nutzungsdauer_'+args.positionid+'" value="'+args.nutzungsdauer+'"'+disabled+'>'+
							'</div>'+//input-group
						'</div>'+
						'<div class="col-lg-1 control-label">'+
							'Jahre'+
						'</div>'+
					'</div>'+
				'</div>'+
				'<div class="col-lg-5">'+
				'</div>'+
			'</div>'+

			'<div class="row">'+
				'<div class="col-lg-6">'+
					'<div class="form-group row">'+
						'<label class="col-lg-4 control-label label-required">Benötigt am</label>'+
						'<div class="col-lg-8">'+
							'<div class="input-group'+datefieldhidden+'" id="benoetigtamgroup_'+args.positionid+'">'+
								'<span class = "input-group-addon">'+
									'<i class="fa fa-calendar"></i>'+
								'</span>'+
								'<input type="text" class="form-control" name="benoetigtam"  id="benoetigtam_'+args.positionid+'" value="'+benoetigt_am+'"'+disabled+'>'+
							'</div>'+//input-group
			 				'<div class="input-group">'+
								'<label class="checkbox-inline control-label">'+
									'<input type="checkbox" name="jahrverteilen" id="jahrverteilen_'+args.positionid+'"'+disabled+jahrverteilenchecked+'>'+
									'Betrag aufs Jahr verteilen'+
								'</label>'+
							'</div>'+//form-group row
						'</div>'+//column
					'</div>'+//form-group row
				'</div>'+
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
		return '<p>Der Status des Antrags wird <span class="frgAdj"></span>. '+
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
		return '<p>Der Status des Antrags wird <span class="frgAdj"></span>, der Antrag kann nicht mehr bearbeitet werden.</p>'+
			'<p>Alle nicht gespeicherten Daten gehen verloren. Bist du sicher, dass du den Budgetantrag <span class="frgVerb"></span> m&ouml;chtest?</p>';
	},

	/**
	 * Return bodytext for modal for changing Budgetantrag to new
	 * @returns {string}
	 */
	getModalNewHtml: function()
	{
		return '<p>Der Status des Antrags wird auf <span class="frgAdj"></span> gesetzt, der Antrag kann wieder bearbeitet werden.</p>'+
			'<p>Bist du sicher, dass du den Budgetantrag <span class="frgVerb"></span> m&ouml;chtest?</p>';
	}
};
