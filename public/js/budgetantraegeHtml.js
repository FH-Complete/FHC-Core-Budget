/*
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * javascript file for returning html needed by the budgetantraegeView.
 * methods here excpect paraemters and return html, filled with this parameters
 */

/**
 * Gets html placed before the Budgetanträge panels
 * @returns {string}
 */
function getPreBudgetantragHtml()
{
	return '<div class="row">'+
				'<div class="col-lg-7">'+
					'<div class="input-group" id="budgetbezgroup">'+
						'<input type="text" class="form-control" id="budgetbezeichnung" placeholder="Budgetantragsbezeichnung eingeben">'+
						'<span class="input-group-btn">'+
							'<button class="btn btn-default" id="addBudgetantrag">'+
							'<i class="fa fa-plus"></i>&nbsp;Budgetantrag hinzufügen'+
							'</button>'+
						'</span>'+
					'</div>'+
				'</div>'+
				'<div class="col-lg-5">'+<!-- style="margin-top: 6px"-->
				/*				'<table class="table table-bordered table-condensed">'+*/
				/*					'<thead>'+
				 '<tr>'+
				 '<th>Gespeichert</th>'+
				 '</tr>'+
				 '</thead>'+*/
				/*					'<tbody>'+
				 '<tr>'+
				 '<td style="padding: 6px"><strong>Gespeichert: </strong><span id="savedSum">€ 0,00</span></td>'+
				 '</tr>'+
				 '</tbody>'+
				 '</table>'+*/
					'<div class="well well-sm" style="padding: 6px;">'+
						'<strong>Gespeichert:&nbsp;</strong><span id="savedSum"></span>'+
					'</div>'+
				'</div>'+
				'<br><br>'+
			'</div>'+
			'<div class="row">'+
				'<div class="col-lg-12">'+
				'<div class="panel-group" id="budgetantraege"></div></div>'+
			'</div>';
}

/**
 * Gets the html for a Budgetantrag, filling it with Budgetantrag data
 * @param args the Budgetantrag data, but also other formatting data
 * @returns {string} html string
 */
function getBudgetantragHtml(args)
{
	return '<div class="panel-heading">'+
				'<div class="row">'+
					'<div class="col-lg-3 col-sm-3">'+
						'<h4 class="panel-title">'+
						'<a class="accordion-toggle'+args.collapseHtml+'" data-toggle="collapse" data-parent="#budgetantraege" href="#collapse'+args.budgetantragid+'">'+
						args.budgetname+
						'</a>'+
						'<span id="unsaved_'+args.budgetantragid+'" class="hidden">&nbsp;&nbsp;<i class="glyphicon glyphicon-floppy-remove text-danger"></i></span>'+
						'</h4>'+
					'</div>'+
					'<div class="col-lg-2 col-lg-offset-2 col-sm-2 col-sm-offset-2 text-center" id="sum_'+args.budgetantragid+'"></div>'+
/*					'<div class="col-lg-2 col-lg-offset-2 col-sm-3 col-sm-offset-1 text-right">Budgetantrag</div>'+*/
					'<div class="col-lg-1 col-lg-offset-4 col-sm-1 col-sm-offset-4 text-right">'+
						'<i class="fa fa-times text-danger" id="remove_'+args.budgetantragid+'" role="button"></i>'+
					'</div>'+
				'</div>'+
			'</div>'+//panel-heading
			'<div id="collapse'+args.budgetantragid+'" class="panel-collapse collapse'+args.collapseInHtml+'">'+
				'<div class="panel-body form-horizontal">'+
					'<div id="budgetPosition_'+args.budgetantragid+'" class="panel-group"></div>'+
					'<div class="row">'+
						'<div class="col-lg-12">'+
							'<button class="btn btn-default" id="addPosition_'+args.budgetantragid+'">'+
							'<i class="fa fa-plus"></i>&nbsp;'+
							'Budgetposten hinzufügen'+
							'</button>'+
						'</div>'+
					'</div>'+
				'</div>'+//panel-body
				'<div class="panel-footer">'+
				'</div>'+//panel-footer
			'</div>';//collapse item
}

/**
 * Gets html for footer of a Budgetantrag (different depending if its a new or existent Budgetantrag)
 * @param args
 * @returns {string}
 */
function getBudgetantragFooterHtml(args)
{
	var html = "";
	var saveBtnHtml = '<button class="btn btn-default" id="save_'+args.budgetantragid+'">'+
		'<i class="glyphicon glyphicon-floppy-disk"></i>&nbsp;'+
		'<span>Speichern</span>'+//id="saveBtnText_'+args.budgetantragid+'"
		'</button>';
	
	if (args.isNewAntrag === false)
	{
		html +=
			'<div class="row">'+
				'<div class="col-lg-5">'+
					'<button class="btn btn-default">Freigeben</button>&nbsp;&nbsp;'+
					'<button class="btn btn-default">Genehmigen</button>&nbsp;&nbsp;'+
					'<button class="btn btn-default">Ablehnen</button>'+
				'</div>'+
				'<div class="col-lg-2 text-center antragMsg" id="msg_'+args.budgetantragid+'">'+
				'</div>'+
				'<div class="col-lg-5 text-right">'+
					saveBtnHtml+'&nbsp;&nbsp;'+
					'<button class="btn btn-default">Abschicken</button>' +
				'</div>'+
			'</div>';
	}
	else
	{
		html +=
			'<div class="row">'+
				'<div class="col-lg-5">'+
					saveBtnHtml+
				'</div>'+
				'<div class="col-lg-2 text-center antragMsg" id="msg_'+args.budgetantragid+'">'+
				'</div>'+
			'</div>';
	}
	
	return html;
}

/**
 * Gets Html for a Budgetposition
 * @param args
 * @returns {string}
 */
function getBudgetpositionHtml(args)
{
	var html =
		'<div class="panel panel-default" id="'+positionPrefix+'_'+args.positionid+'">'+
			'<div class="panel-heading">' +
				'<div class="row">'+
					'<div class="col-lg-11 col-sm-11">'+
						'<a class="accordion-toggle'+args.collapseHtml+'" data-toggle="collapse" href="#collapsePosition'+args.positionid+'">'+
						args.budgetposten+' | € '+formatDecimalGerman(args.betrag)+
						'</a>'+
					'</div>'+
					'<div class="col-lg-1 col-sm-1 text-right">'+
						'<i class="fa fa-times text-danger" id="removePosition_'+args.positionid+'" role="button"></i>'+
					'</div>'+
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
						'<input type="text" class="form-control" name="budgetposten" value="'+args.budgetposten+'">'+
					'</div>'+
				'</div>'+
			'</div>'+
			'<div class="col-lg-5">'+
				'<div class="form-group row">'+
					'<label class="col-lg-4 control-label">Projekt</label>'+
					'<div class="col-lg-8">'+
						'<select class="form-control" name="projekt_id">'+
							'<option value="null">Projekt wählen...</option>';

	for (var i = 0; i < global_preloads.projekte.length; i++)
	{
		var projekt = global_preloads.projekte[i];
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
						'<select class="form-control" name="konto_id">'+
							'<option value="null">Konto wählen...</option>';

	for (var i = 0; i < global_preloads.konten.length; i++)
	{
		var konto = global_preloads.konten[i];
		var selected = args.konto_id === konto.konto_id ? ' selected=""' : '';

		if (konto.aktiv === false)
			konto.kurzbz = konto.kurzbz.split("").join("̶")+"̶";

		html += '<option value="' + konto.konto_id + '"' + selected + '>' + konto.kurzbz + '</option>';
	}

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
							'<input type="text" class="form-control" name="betrag" value="'+formatDecimalGerman(args.betrag)+'">'+
						'</div>'+//input-group
					'</div>'+//column
				'</div>'+//form-group row
			'</div>'+//column
		'</div>'+//row
		'<div class="form-group row">'+
			'<label class="col-lg-2 control-label">Beschreibung</label>'+
			'<div class="col-lg-9">'+
				'<textarea class="form-control" name="kommentar">'+args.kommentar+'</textarea>'+
			'</div>'+
		'</div>'+
		'</form>'+
		'</div>'+// ./panel-body
		'</div>';// ./panel-collapse

	return html;
}