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
// HTML-modifiers (append, remove html)

/**
 * Appends Kostenstellen to global Kostenstellen dropdown
 * @param kostenstellen
 */
function appendKostenstellen(kostenstellen)
{
	var kostenstelleDom = $("#kostenstelle");

	var prevKostenstelle = kostenstelleDom.val();

	kostenstelleDom.find("option:not([value='null'])").remove();

	for (var i = 0; i < kostenstellen.length; i++)
	{
		var kostenstelle = kostenstellen[i];
		var selected = kostenstelle.kostenstelle_id === prevKostenstelle ? 'selected=""' : '';
		var bezeichnung = kostenstelle.bezeichnung;
		var inactivehtml = "";

		if (kostenstelle.aktiv === false)
		{
			bezeichnung += " (inaktiv)";
			inactivehtml = 'class = "inactiveoption"';
		}

		kostenstelleDom.append('<option value="'+kostenstelle.kostenstelle_id+'"'+inactivehtml+' '+selected+'>'+bezeichnung+'</option>');
	}
}

/**
 * Appends the html before the Budgetantraege panels, i.e. input field for adding new Budgetantrag and sums
 */
function appendPreBudgetantraegeHtml()
{
	var html = getPreBudgetantragHtml();

	$("#budgetantraegehtml").html(html);

	$("#addBudgetantrag").click(
		function ()
		{
			appendNewBudgetantrag(NEW_BUDGET_PREFIX + global_counters.countNewAntraege);
		}
	);
}

/**
 * Appends an array of Budgetantraegen and their positions
 * @param antraege
 */
function appendBudgetantraege(antraege)
{
	appendPreBudgetantraegeHtml();
	for (var i = 0; i < antraege.length; i++)
	{
		var budgetantrag = antraege[i];
		var budgetantragid = budgetantrag.budgetantrag_id;

		var editable = global_counters.editmode && GLOBAL_STATUSES[budgetantrag.budgetstatus.budgetstatus_kurzbz].editable;

		appendBudgetantrag(budgetantragid, {"bezeichnung": budgetantrag.bezeichnung}, 0, false, editable);

		var sum = 0;
		for (var j = 0; j < budgetantrag.budgetpositionen.length; j++)
		{
			var position = budgetantrag.budgetpositionen[j];
			var positionid = position.budgetposition_id;

			if (position.betrag !== null)
				sum += parseFloat(position.betrag);

			appendBudgetposition(budgetantragid, positionid, position, false, editable);

			//save initial state of form for tracking changes
			saveInitialFormState(budgetantragid, position.budgetposition_id);
		}
		setBudgetantragStatus(budgetantragid, budgetantrag.budgetstatus);
		setSum(budgetantragid, sum);
		appendBudgetantragFooter(budgetantragid, false, editable);
	}
}

/**
 * Appends a single Budgetantrag.
 * @param budgetantragid
 * @param data
 * @param sum - the sum of all positions of the Budgetantrag to append
 * @param opened - whether the panel for the Budgetantrag is collapsed or opened
 * @param editable - whether the Budgetantrag is editable or readonly
 */
function appendBudgetantrag(budgetantragid, data, sum, opened, editable)
{
	var collapseInHtml = opened === true ? " in" : "";
	var collapseHtml = opened === true ? "" : " collapsed";

	var budgetantrHtml = getBudgetantragHtml({
		"budgetantragid": budgetantragid,
		"budgetname": data.bezeichnung,
		"collapseInHtml": collapseInHtml,
		"collapseHtml": collapseHtml
	}, editable);

	var budgetantragEl = $("#" + BUDGETANTRAG_PREFIX + "_" + budgetantragid);

	if (budgetantragEl.length)
		budgetantragEl.append(budgetantrHtml);
	else
		$("#budgetantraege").prepend('<div class="panel panel-primary" id="' + BUDGETANTRAG_PREFIX + '_' + budgetantragid + '">' +
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
			deleteBudgetantrag(budgetantragid);
		}
	);
}

/**
 * Appends the footer for a Budgetantrag.
 * There are different kinds of footers for a new Antrag and an Antrag to update.
 * @param budgetantragid
 * @param isNewAntrag - wether the Antrag is yet to be added or is already added and can be updated
 * @param editable - whether the Budgetantrag is editable or readonly
 */
function appendBudgetantragFooter(budgetantragid, isNewAntrag, editable)
{
	var footerel = $("#budgetfooter_" + budgetantragid);

	var html = getBudgetantragFooterHtml({"budgetantragid": budgetantragid, "isNewAntrag": isNewAntrag}, editable);
	footerel.html(html);

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

		$("#abschicken_" + budgetantragid).click(
			function ()
			{
				updateBudgetantragStatusAjax(budgetantragid, GLOBAL_STATUSES.sent.bez);
			}
		);

		$("#genehmigen_" + budgetantragid).click(
			function ()
			{
				updateBudgetantragStatusAjax(budgetantragid, GLOBAL_STATUSES.approved.bez);
			}
		);

		$("#ablehnen_" + budgetantragid).click(
			function ()
			{
				updateBudgetantragStatusAjax(budgetantragid, GLOBAL_STATUSES.rejected.bez);
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
 * @param editable - whether the Budgetposition is editable or readonly
 */
function appendBudgetposition(budgetantragid, positionid, positionobj, opened, editable)
{
	var positionargs = {
		"positionid": positionid,
		"budgetposten": "",
		"projekt_id": "null",
		"konto_id": "null",
		"betrag": 0,
		"kommentar": ""
	};

	if (positionobj !== null)
	{
		if (positionobj.bezeichnung !== null) positionargs.budgetposten = positionobj.budgetposten;
		if (positionobj.projekt_id !== null) positionargs.projekt_id = positionobj.projekt_id;
		if (positionobj.konto_id !== null) positionargs.konto_id = positionobj.konto_id;
		if (positionobj.betrag !== null) positionargs.betrag = positionobj.betrag;
		if (positionobj.kommentar !== null) positionargs.kommentar = positionobj.kommentar;
	}

	positionargs.collapseInHtml = opened === true ? " in" : "";
	positionargs.collapseHtml = opened === true ? "" : " collapsed";

	var html = getBudgetpositionHtml(positionargs, editable);

	$("#budgetPosition_" + budgetantragid).append(html);
	$("#removePosition_" + positionid).click(
		function ()
		{
			deleteBudgetposition(budgetantragid, positionid);
			$("#" + POSITION_PREFIX + "_" + positionid).remove();
			checkIfSaved(budgetantragid);
		}
	);

	//events - on change of form show that unsaved
	$("#form_"+positionid).find("input[type=text], textarea").keyup(
		function()
		{
			checkIfSaved(budgetantragid);
		}
	);

	$("#form_"+positionid+" select").change(
		function()
		{
			checkIfSaved(budgetantragid);
		}
	);
}

/**
 * Refreshes a Budgetantrag after it is updated, includes emptying the Budgetantrag element and appending it again.
 * @param budgetantrag
 */
function refreshBudgetantrag(budgetantrag)
{
	var budgetantragid = budgetantrag.budgetantrag_id;
	var budgetantragEl = $("#" + BUDGETANTRAG_PREFIX + "_" + budgetantragid);
	var statuskurzbz = budgetantrag.budgetstatus.budgetstatus_kurzbz;
	var editable = global_counters.editmode && GLOBAL_STATUSES[statuskurzbz].editable;
	var genehmigbar = budgetantrag.genehmigbar;

	budgetantragEl.empty();

	appendBudgetantrag(budgetantragid, {"bezeichnung": budgetantrag.bezeichnung}, 0, true, editable);

	var sum = 0;

	for (var i = 0; i < budgetantrag.budgetpositionen.length; i++)
	{
		var position = budgetantrag.budgetpositionen[i];
		if (position.betrag !== null)
			sum += parseFloat(position.betrag);
		appendBudgetposition(budgetantragid, position.budgetposition_id, position, false, editable);
		saveInitialFormState(budgetantragid, position.budgetposition_id);
	}
	setBudgetantragStatus(budgetantragid, budgetantrag.budgetstatus);
	setSum(budgetantragid, sum);
	appendBudgetantragFooter(budgetantragid, false, editable, genehmigbar);
}

/**
 * Removes Budgetantrag html for a given id, hides deletemodal
 * @param budgetantragid
 */
function removeBudgetantrag(budgetantragid)
{
	$("#delAntragModal").modal('hide');
	$("#" + BUDGETANTRAG_PREFIX + "_" + budgetantragid + " + br").remove();
	$("#" + BUDGETANTRAG_PREFIX + "_" + budgetantragid).remove();
}

/**
 * Removes all Budgetantraege form HTML, including "pre-budgetantraege-html"
 */
function removeBudgetantraege()
{
	$("#budgetantraegehtml").empty();
}

/**
 * Checks if a Budgetantrag is saved, and initializes html modifications accordingly
 * @param budgetantragid
 */
function checkIfSaved(budgetantragid)
{
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);

	//if not found in existent, assuming it is a new Budgetantrag - not saved yet!
	//if it has new positions - unsaved too
	if (budgetantrag === false || budgetantrag.positionentoadd.length > 0)
	{
		markUnsaved(budgetantragid);
		return;
	}

	//otherwise set unsaved icon if form changed
	var positionen = budgetantrag.positionen;

	for (var i = 0; i < positionen.length; i++)
	{
		if (checkIfBudgetpositionFormChanged(positionen[i]))
		{
			markUnsaved(budgetantragid);
			return;
		}
	}

	markSaved(budgetantragid);
}

/**
 * Marks a Budgetantrag html as unsaved
 * @param budgetantragid
 */
function markUnsaved(budgetantragid)
{
	var savebtn = $("#save_"+budgetantragid);

	$("#unsaved_" + budgetantragid).removeClass("hidden");
	$("#"+BUDGETANTRAG_PREFIX+"_"+budgetantragid+" > .panel-heading > .row").addClass("text-danger");
	setMessage(budgetantragid, "text-danger", "Budgetantrag noch nicht gespeichert!");
	savebtn.find(".glyphicon-floppy-disk").addClass("text-danger");
	savebtn.css("border-color", "#a94442");
}

/**
 * Marks a Budgetantrag html as saved
 * @param budgetantragid
 */
function markSaved(budgetantragid)
{
	var savebtn = $("#save_"+budgetantragid);

	$("#unsaved_" + budgetantragid).addClass("hidden");
	$("#"+BUDGETANTRAG_PREFIX+"_"+budgetantragid+" > .panel-heading > .row").removeClass("text-danger");
	setMessage(budgetantragid, "", "");
	savebtn.find(".glyphicon-floppy-disk").removeClass("text-danger");
	savebtn.css("border-color", "#adadad");
}

/**
 * Shows Modal for confirmation of deletion of a Budgetantrag
 * @param budgetantragbezeichnung
 */
function showDelBudgetantragModal(budgetantragbezeichnung)
{
	$("#delBudgetantragBez").html(budgetantragbezeichnung);
	$("#delAntragModal").modal('show');
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
 * Adds all sums (gespeichert, freigegeben) to totals table on top
 * @param budgetantragid
 * @param status
 */
function setBudgetantragStatus(budgetantragid, status)
{
	var statustext = status.bezeichnung + (status.datum === "" ? "" : " am "+formatDateGerman(status.datum));
	$("#budgetstatus_"+budgetantragid).text(statustext);
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

/**
 * Retrieves all Budgetpositionen from the Budgetantragform with a given id,
 * checks if Positiondata is valid before
 * @param budgetantragid
 * @param withid specifies format of returnarray: each Position wrapped with id or not
 * @returns {*} the Budgetpositionen if retrieved successfully, null otherwise (e.g. when wrong input)
 */
function retrieveBudgetantragPositionen(budgetantragid, withid)
{
	var positionenForms = $("#" + BUDGETANTRAG_PREFIX + "_" + budgetantragid + " form");
	var positionen = [], messages = [];

	//clear error marks
	$("#budgetPosition_"+budgetantragid+" .has-error").removeClass("has-error");
	$("#budgetPosition_"+budgetantragid+" .accordion-toggle").removeClass("text-danger");

	var valid = true;

	for (var i = 0; i < positionenForms.length; i++)
	{
		var positionForm = positionenForms[i];
		var position_id = positionForm.id.substr(positionForm.id.indexOf("_") + 1);

/*		if (withid === true)*/

		var positionFormDom = $(positionForm);

		var positionFields = checkBudgetpositionDataBeforeAdd(positionFormDom, budgetantragid);

		if (positionFields.error === 1 || !valid)
		{
			for (var j = 0; j < positionFields.data.length; j++)
			{
				if (messages.indexOf(positionFields.data[j]) === -1)
					messages.push(positionFields.data[j]);
			}
			valid = false;
		}

		var positiondata = positionFields.data;

		if (!valid)
			continue;

		positiondata.projekt_id.val = positiondata.projekt_id.val === 'null' ? null : positiondata.projekt_id.val;

		var position = {
			"budgetposten": positiondata.budgetposten.val,
			"projekt_id": positiondata.projekt_id.val,
			"konto_id": positiondata.konto_id.val,
			"betrag": positiondata.betrag.val,
			"kommentar": positiondata.kommentar.val
		};

		//id wrapper for update
		if (withid === true)
		{
			position = {
				"budgetposition_id": position_id,
				"position": position
			};
		}

		positionen.push(position);
	}

	if (!valid)
	{
		setMessage(budgetantragid, "text-danger", messages.join(" "));
		return null;
	}
	else
	{
		//check if Budgetposten with same name already exists in Budgetantrag
		var seen = {};
		for (var i = 0; i < positionenForms.length; i++)
		{
			var positionForm = positionenForms[i];
			var position_id = positionForm.id.substr(positionForm.id.indexOf("_") + 1);

			var budgetpostenel = $(positionForm).find("input[name=budgetposten]");
			var budgetpostenbez = $(positionForm).find("input[name=budgetposten]").val();
			if (seen[budgetpostenbez])
			{
				setMessage(budgetantragid, "text-danger", "Positionen mit gleichem Namen vorhanden!");
				$("#position_"+position_id+" .panel-heading .accordion-toggle").addClass("text-danger");
				budgetpostenel.closest(".form-group").addClass("has-error");

				$("#position_"+seen[budgetpostenbez]+" .panel-heading .accordion-toggle").addClass("text-danger");
				$("#form_"+seen[budgetpostenbez]).find("input[name=budgetposten]").closest(".form-group").addClass("has-error");;

				return null;
			}
			else
				seen[budgetpostenbez] = position_id;
		}
	}

	return positionen;
}

// -----------------------------------------------------------------------------------------------------------------
// Helper functions

/**
 * Checks if a Budgetantrag can be appended, and shows errors if not
 * @returns {*|jQuery} - the Budgetbezeichnung if passed, false otherwise
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
	else
	{
		//check if Budgetantrag with this Bezeichnung already exists or is added
		for (var i = 0; i < global_budgetantraege.existentBudgetantraege.length; i++){
			if (global_budgetantraege.existentBudgetantraege[i].bezeichnung === budgetBezeichnung)
			{
				$("#budgetbezgroup").addClass("has-error");
				passed = false;
				break;
			}
		}

		if (passed !== false)
		{
			for (var i = 0; i < global_budgetantraege.newBudgetantraege.length; i++)
			{
				if (global_budgetantraege.newBudgetantraege[i].bezeichnung === budgetBezeichnung)
				{
					$("#budgetbezgroup").addClass("has-error");
					passed = false;
					break;
				}
			}
		}
	}

	//remove Bezeichnung if everything ok
	if (passed !== false)
		$("#budgetbezeichnung").val("");

	return passed;
}

/**
 * Checks entries for a Budgetposition before it is saved.
 * @param positionFormDom
 * @returns {*} object inidicating if data has an error (is invalid)
 * and containing either error messages or the positiondata
 */
function checkBudgetpositionDataBeforeAdd(positionFormDom)
{
	var valid = true;

	var budgetpostenelem = positionFormDom.find("input[name=budgetposten]");
	var projektidelem = positionFormDom.find("select[name=projekt_id]");
	var kontoidelem = positionFormDom.find("select[name=konto_id]");
	var betragelem = positionFormDom.find("input[name=betrag]");
	var kommentarelem = positionFormDom.find("textarea[name=kommentar]");

	var positionFields = {};
	var messages = [];

	positionFields.budgetposten = {"elem": budgetpostenelem, "val": budgetpostenelem.val(), "required": true};
	positionFields.projekt_id = {"elem": projektidelem, "val": projektidelem.val(), "required": false};
	positionFields.konto_id = {"elem": kontoidelem, "val": kontoidelem.val(), "required": true};
	positionFields.betrag = {"elem": betragelem, "val": betragelem.val(), "required": true};
	positionFields.kommentar= {"elem": kommentarelem, "val": kommentarelem.val(), "required": false};

	//check required fields
	$.each(positionFields, function(name, value) {
		if (value.required === true && (value.val === null || value.val === "" || value.val === "null"))
		{
			value.elem.closest(".form-group").addClass("has-error");
			valid = false;
		}
	});

	if (!valid)
	{
		messages.push("Pflichtfelder nicht ausgefüllt!");
	}

	if (!checkDecimalFormat(positionFields.betrag.val))
	{
		valid = false;
		betragelem.parent().addClass("has-error");
		messages.push("Ungültiges Zahlenformat!");
	}
	else
	{
		positionFields.betrag.val = positionFields.betrag.val.replace(",", ".");
	}

	if (!valid)
	{
		return {"error": 1, "data": messages};
	}

	return {"error": 0, "data": positionFields};
}

/**
 * Checks if user changed a Budgetposition form. Compares initial state with current Budgetposition form state
 * @param initBudgetposition Budgetposition object containing the initial state
 * @returns {boolean} wether the Budgetposition form was modified
 */
function checkIfBudgetpositionFormChanged(initBudgetposition)
{
	return initBudgetposition.initialForm !== $("#form_"+initBudgetposition.id).serialize();
}

/**
 * Collapses all Budgetantraege (and Budgetpositionen) panels
 */
function collapseAllBudgetantraege()
{
	$(".accordion-toggle").addClass("collapsed");
	$(".panel-collapse").removeClass("in");
}
