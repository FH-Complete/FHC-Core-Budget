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
 * javascript file for modifying html (DOM) of Budgetanträge view
 */

// -----------------------------------------------------------------------------------------------------------------
// Appenders (append html)

/**
 * Appends an array of Budgetantraegen and their positions
 * @param antraege
 */
function appendBudgetantraege(antraege)
{
	for (var i = 0; i < antraege.length; i++)
	{
		var antrag = antraege[i];
		var antragid = antrag.budgetantrag_id;

		appendBudgetantrag(antragid, antrag.bezeichnung, 0, false);

		var sum = 0;
		for (var j = 0; j < antrag.budgetpositionen.length; j++)
		{
			var position = antrag.budgetpositionen[j];
			var positionid = position.budgetposition_id;
			if (position.betrag !== null)
				sum += parseFloat(position.betrag);
			appendBudgetposition(antragid, positionid, position, false);

			//save initial state of form for tracking changes
			saveInitialFormState(antragid, position.budgetposition_id);
		}
		setSum(antragid, sum);
		appendBudgetantragFooter(antragid, false);
	}
}

/**
 * Appends a single Budgetantrag.
 * @param budgetantragid
 * @param bezeichnung
 * @param sum - the sum of all positions of the Budgetantrag to append
 * @param opened - whether the panel for the Budgetantrag is collapsed or opened
 */
function appendBudgetantrag(budgetantragid, bezeichnung, sum, opened)
{
	var collapseInHtml = opened === true ? " in" : "";
	var collapseHtml = opened === true ? "" : " collapsed";

	var budgetantrHtml = getBudgetantragHtml({
		"budgetantragid": budgetantragid,
		"budgetname": bezeichnung,
		"collapseInHtml": collapseInHtml,
		"collapseHtml": collapseHtml
	});

	var budgetantragEl = $("#" + budgetantragPrefix + '_' + budgetantragid);

	if (budgetantragEl.length)
		budgetantragEl.append(budgetantrHtml);
	else
		$("#budgetantraege").prepend('<div class="panel panel-primary" id="' + budgetantragPrefix + '_' + budgetantragid + '">' +
			budgetantrHtml +
			'</div><br>');//panel

	setSum(budgetantragid, sum);

	$("#addPosition_" + budgetantragid).click(
		function ()
		{
			appendNewBudgetposition(budgetantragid);
		}
	);

	$("#remove_" + budgetantragid).click(
		function ()
		{
			$("#delBudgetantragBez").html(bezeichnung);
			$("#delModalConfirm").click(
				function ()
				{
					$("#delAntragModal").modal('hide');
					deleteBudgetantrag(budgetantragid);
					$("#" + budgetantragPrefix + "_" + budgetantragid + " + br").remove();
					$("#" + budgetantragPrefix + "_" + budgetantragid).remove();
				}
			);
			$("#delAntragModal").modal('show');
		}
	);
}

/**
 * Appends the footer for a Budgetantrag.
 * There are different kinds of footers for a new Antrag and an Antrag to update.
 * @param budgetantragid
 * @param isNewAntrag - wether the Antrag is yet to be added or is already added and can be updated.
 */
function appendBudgetantragFooter(budgetantragid, isNewAntrag)
{
	var html = '';

	if (isNewAntrag === false)
	{
		html +=
			'<div class="row">'+
				'<div class="col-lg-5">'+
					'<button class="btn btn-default" id="save_'+budgetantragid+'">Speichern</button>&nbsp;&nbsp;'+
					'<button class="btn btn-default">Abschicken</button>&nbsp;&nbsp;' +
					'<button class="btn btn-default">Freigeben</button>'+
				'</div>'+
				'<div class="col-lg-2 text-center antragMsg" id="msg_'+budgetantragid+'">'+
				'</div>'+
				'<div class="col-lg-5 text-right">'+
					'<button class="btn btn-default">Genehmigen</button>&nbsp;&nbsp;'+
					'<button class="btn btn-default">Ablehnen</button>'+
				'</div>'+
			'</div>';
	}
	else
	{
		html +=
			'<div class="row">'+
				'<div class="col-lg-12">'+
					'<button class="btn btn-default" id="save_'+budgetantragid+'">Speichern</button>'+
				'</div>'+
			'</div>';
	}

	$("#" + budgetantragPrefix + "_" + budgetantragid + " .panel-footer").append(html);

	if (isNewAntrag === true)
	{
		$("#save_" + budgetantragid).click(
			function ()
			{
				addNewBudgetantrag(budgetantragid);
			}
		);
	}
	else
	{
		$("#save_" + budgetantragid).click(
			function ()
			{
				updateBudgetpositionen(budgetantragid);
			}
		);
	}
}

/**
 * Appends a Budgetposition for a Budgetantrag.
 * @param budgetantragid
 * @param positionid
 * @param positionobj - contains position data if it is an existing Budgetposition, null otherwise
 * @param opened - whether the panel for the Budgetposition is collapsed or opened
 */
function appendBudgetposition(budgetantragid, positionid, positionobj, opened)
{
	var budgetposten = "";
	var projekt_id = "null";
	var konto_id = "null";
	var betrag = 0;
	var kommentar = "";

	if (positionobj !== null)
	{
		if (positionobj.bezeichnung !== null) budgetposten = positionobj.budgetposten;
		if (positionobj.projekt_id !== null) projekt_id = positionobj.projekt_id;
		if (positionobj.konto_id !== null) konto_id = positionobj.konto_id;
		if (positionobj.betrag !== null) betrag = positionobj.betrag;
		if (positionobj.kommentar !== null) kommentar = positionobj.kommentar;
	}

	var collapseHtml = opened === true ? ' in' : '';

	var html =
		'<div class="panel panel-default" id="'+positionPrefix+'_'+positionid+'">'+
			'<div class="panel-heading">' +
				'<div class="row">'+
					'<div class="col-lg-11 col-sm-11">'+
					'<a data-toggle="collapse" href="#collapsePosition'+positionid+'">'+
					budgetposten+' | € '+formatDecimalGerman(betrag)+
					'</a>'+
					'</div>'+
					'<div class="col-lg-1 col-sm-1 text-right">'+
					'<i class="fa fa-times text-danger" id="removePosition_'+positionid+'" role="button"></i>'+
					'</div>'+
				'</div>'+
			'</div>'+//panel-heading
		'<div class="panel-collapse collapse'+collapseHtml+'" id="collapsePosition'+positionid+'">';

	html +=
		'<div class="panel-body">'+
		'<form id="form_'+positionid+'">'+
		'<div class="form-group row">'+
			'<label class="col-lg-2 control-label">Budgetposten</label>'+
			'<div class="col-lg-5">'+
				'<input type="text" class="form-control" name="budgetposten" value="'+budgetposten+'">'+
			'</div>'+
			'<label class="col-lg-1 control-label">Projekt</label>'+
			'<div class="col-lg-3">'+
				'<select class="form-control" name="projekt_id">'+
					'<option value="null">Projekt wählen...</option>';

	for (var i = 0; i < global_preloads.projekte.length; i++)
	{
		var projekt = global_preloads.projekte[i];
		var selected = projekt_id === projekt.projekt_id ? ' selected=""' : '';
		html += '<option value="' + projekt.projekt_id + '"' + selected + '>' + projekt.titel + '</option>';
	}

	html +=
				'</select>'+
			'</div>'+ //column
		'</div>'+//form-group row
		'<div class="form-group row">'+
			'<label class="col-lg-2 control-label">Konto</label>'+
			'<div class="col-lg-5">'+
				'<select class="form-control" name="konto_id">'+
					'<option value="null">Konto wählen...</option>';

	for (var i = 0; i < global_preloads.konten.length; i++)
	{
		var konto = global_preloads.konten[i];
		var selected = konto_id === konto.konto_id ? ' selected=""' : '';
		html += '<option value="' + konto.konto_id + '"' + selected + '>' + konto.kurzbz + '</option>';
	}

	html +=
				'</select>'+
			'</div>'+
			'<label class="col-lg-1 control-label">Betrag</label>'+
			'<div class="col-lg-3">'+
				'<div class="input-group">'+
					'<span class = "input-group-addon">'+
						'<i class="fa fa-eur"></i>'+
					'</span>'+
					'<input type="text" class="form-control" name="betrag" value="'+formatDecimalGerman(betrag)+'">'+
				'</div>'+//input-group
			'</div>'+//column
		'</div>'+//form-group row
		'<div class="form-group row">'+
			'<label class="col-lg-2 control-label">Kommentar</label>'+
			'<div class="col-lg-9">'+
				'<textarea class="form-control" name="kommentar">'+kommentar+'</textarea>'+
			'</div>'+
		'</div>'+
		'</form>'+
		'</div>'+// ./panel-body
		'</div>';// ./panel-collapse


	$("#budgetPosition_" + budgetantragid).append(html);
	$("#removePosition_" + positionid).click(
		function ()
		{
			deleteBudgetposition(budgetantragid, positionid);
			$("#" + positionPrefix + "_" + positionid).remove();
		}
	);
}

/**
 * Refreshes a Budgetantrag after it is updated, includes emptying the Budgetantrag element and appending it again.
 * @param budgetantragid
 * @param budgetAntrag
 */
function refreshBudgetantrag(budgetantragid, budgetAntrag)
{
	var budgetantragEl = $("#" + budgetantragPrefix + "_" + budgetantragid);

	budgetantragEl.empty();

	appendBudgetantrag(budgetantragid, budgetAntrag.bezeichnung, 0, true);

	var sum = 0;

	for (var i = 0; i < budgetAntrag.budgetpositionen.length; i++)
	{
		var position = budgetAntrag.budgetpositionen[i];
		if (position.betrag !== null)
			sum += parseFloat(position.betrag);
		appendBudgetposition(budgetantragid, position.budgetposition_id, position, false);
		saveInitialFormState(budgetantragid, position.budgetposition_id);
	}
	setSum(budgetantragid, sum);
	appendBudgetantragFooter(budgetantragid, false);
	setMessage(budgetantragid, 'text-success', 'Budgetantrag erfolgreich gespeichert!');
}

/**
 * Adds the given sum to a Budgetantrag html
 * @param budgetantragid
 * @param sum
 */
function setSum(budgetantragid, sum)
{
	$("#sum_" + budgetantragid).text('€ ' + formatDecimalGerman(sum));
}

/**
 * Adds all sums (gespeichert, freigegeben) to totals table on top
 * @param sums
 */
function setTotalSums(sums)
{
	$("#savedSum").text('€ '+formatDecimalGerman(sums.savedsum));
}

/**
 * Adds a message to a Budgetantrag html
 * @param budgetantragid
 * @param classname
 * @param msg
 */
function setMessage(budgetantragid, classname, msg)
{
	$(".antragMsg").html("");
	$("#msg_"+budgetantragid).html('<span class="'+classname+'">'+msg+'</span>');
}

// -----------------------------------------------------------------------------------------------------------------
// Retrievers (get values from html)

function retrieveBudgetantragPositionen(budgetantragid, withid)
{
	var positionenForms = $("#" + budgetantragPrefix + "_" + budgetantragid + " form");
	var positionen = [];
	for (var i = 0; i < positionenForms.length; i++)
	{
		var positionForm = positionenForms[i];
		var position_id = positionForm.id.substr(positionForm.id.indexOf("_") + 1);
		var positionFormDom = $(positionForm);

		var budgetposten = positionFormDom.find("input[name=budgetposten]").val();
		var projekt_id = positionFormDom.find("select[name=projekt_id]").val();
		var konto_id = positionFormDom.find("select[name=konto_id]").val();
		var betragelem = positionFormDom.find("input[name=betrag]");
		var betrag = betragelem.val();
		//console.log(JSON.stringify(betraginput));
		//console.log(betrag);
		var kommentar = positionFormDom.find("textarea[name=kommentar]").val();

		//check for correct numeric input, and html sanitize
		if (!betrag.trim())
			betrag = null;
		else if (!checkDecimalFormat(betrag))
		{
			betragelem.parent().addClass('has-error');
			return null;
		}
		else
		{
			betragelem.parent().removeClass('has-error');
			betrag = betrag.replace(',', '.');
		}

		projekt_id = projekt_id === 'null' ? null : projekt_id;
		konto_id = konto_id === 'null' ? null : konto_id;

		var position = {
			"budgetposten": budgetposten,
			"projekt_id": projekt_id,
			"konto_id": konto_id,
			"betrag": betrag,
			"kommentar": kommentar
		};

		//console.log(position);
		if (withid === true)
		{
			position = {
				"budgetposition_id": position_id,
				"position": position
			};
		}

		//console.log(budgetposten);
		positionen.push(position);
	}

	return positionen;
}

// -----------------------------------------------------------------------------------------------------------------
// Helper functions

/**
 * Checks if a Budgetantrag can be appended, and shows errors if not
 * @returns {*|jQuery}
 */
function checkBudgetantragDataBeforeAdd()
{
	//checks - Geschäftsjahr, Kostenstelle, Budgetantragbezeichnung
	var budgetBezeichnung = $("#budgetbezeichnung").val();

	var passed = budgetBezeichnung;

	var gjgroup = $("#gjgroup");
	var kstgroup = $("#kstgroup");
	var budgetbezgroup = $("#budgetbezgroup");

	gjgroup.removeClass("has-error");
	kstgroup.removeClass("has-error");
	budgetbezgroup.removeClass("has-error");

	if (global_inputparams.geschaeftsjahr === 'null' || global_inputparams.geschaeftsjahr === null)
	{
		$("#gjgroup").addClass("has-error");
		passed = false;
	}

	if (global_inputparams.kostenstelle === 'null' || global_inputparams.kostenstelle === null)
	{
		$("#kstgroup").addClass("has-error");
		passed = false;
	}

	if (!budgetBezeichnung.trim())
	{
		$("#budgetbezgroup").addClass("has-error");
		passed = false;
	}

	//remove Bezeichnung if everything ok
	if (passed !== false)
		$("#budgetbezeichnung").val("");

	return passed;
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
						'</h4>'+
					'</div>'+
					'<div class="col-lg-2 col-lg-offset-2 col-sm-2 col-sm-offset-2 text-center" id="sum_'+args.budgetantragid+'">'+
					'</div>'+
					'<div class="col-lg-1 col-lg-offset-4 col-sm-1 col-sm-offset-4 text-right">'+
					'<i class="fa fa-times text-danger" id="remove_'+args.budgetantragid+'" role="button"></i>'+
					'</div>'+
				'</div>'+
			'</div>'+//panel-heading
			'<div id="collapse'+args.budgetantragid+'" class="panel-collapse collapse'+args.collapseInHtml+'">'+
				'<div class="panel-body form-horizontal">'+
					'<div id="budgetPosition_'+args.budgetantragid+'" class="panel-group"></div>'+
						'<div class="row">'+
							'<div class="col-lg-12 text-right">'+
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
 * Checks if user changed a Budgetposition form. Compares initial state with current Budgetposition form state
 * @param initBudgetposition Budgetposition object containing the initial state
 * @param position_id
 * @returns {boolean} wether the Budgetposition form was modified
 */
function checkIfBudgetpositionFormChanged(initBudgetposition, position_id)
{
	return initBudgetposition.initialForm !== $("#form_"+position_id).serialize();
}

/**
 * Collapses all Budgetantraege (and Budgetpositionen) panels
 */
function collapseAllBudgetantraege()
{
	$(".accordion-toggle").addClass("collapsed");
	$(".panel-collapse").removeClass("in");
}
