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
 * javascript file for managing Budgetanträge
 * This controller calls functions from the js view for modifying the DOM,
 * and calls functions from the js ajax files to perform calls to the Budgetantraege controller
 */

//id prefixes
const newBudgetPrefix = "newb", newPositionPrefix = "newp", budgetantragPrefix = "budget", positionPrefix = "position";

var global_inputparams = {"geschaeftsjahr": null, "kostenstelle": null};
//global objects for storing current state of Budgetanträge together with their positions: how many added, deleted, updated
var global_preloads = {"projekte": [], "konten": []};
var global_budgetantraege = {"newBudgetantraege": [], "existentBudgetantraege": []};
var global_counters = {"countNewAntraege": 0, "countNewPosition": 0};//counter for giving unique id to every new position, [positionPrefix]_[counter]

$(document).ready(
	function ()
	{
		global_inputparams.geschaeftsjahr = $("#geschaeftsjahr").val();
		global_inputparams.kostenstelle = $("#kostenstelle").val();

		$.when(
			getProjekteAjax(), getKontenAjax()
		).done(
			function (projekteResponse, kontenResponse)
			{
				global_preloads.projekte = projekteResponse[0];
				global_preloads.konten = kontenResponse[0];
				getBudgetantraege();
			}
		);

		//change view anytime a new Geschäftsjahr/Kostenstelle is entered
		$("#geschaeftsjahr").change(
			function ()
			{
				global_inputparams.geschaeftsjahr = $(this).val();
				$("#gjgroup").removeClass("has-error");
				getBudgetantraege();
			}
		);

		$("#kostenstelle").change(
			function ()
			{
				global_inputparams.kostenstelle = $(this).val();
				$("#kstgroup").removeClass("has-error");
				getBudgetantraege();
			}
		);

		$("#addBudgetantrag").click(
			function ()
			{
				appendNewBudgetantrag(newBudgetPrefix + global_counters.countNewAntraege);
			}
		);
	}
);

// -----------------------------------------------------------------------------------------------------------------
// Initialisers (call ajax functions, view functions)

/**
 * Gets all Budgetanträge for Geschäftsjahr and Kostenstelle globals and adds them as "existing Antraege"
 */
function getBudgetantraege()
{
	if (global_inputparams.geschaeftsjahr !== null && global_inputparams.geschaeftsjahr !== 'null' && global_inputparams.kostenstelle !== null && global_inputparams.kostenstelle !== 'null')
	{
		getBudgetantraegeAjax(global_inputparams.geschaeftsjahr, global_inputparams.kostenstelle)
	}
}

/**
 * Adds new Budgetantrag which ids is already saved in global newBudgetantraegearray
 * Initializes retrieving form data and Ajax call
 * @param budgetantragid
 */
function addNewBudgetantrag(budgetantragid)
{
	var budgetantrag = findInArray(global_budgetantraege.newBudgetantraege, budgetantragid);

	if (budgetantrag === false) return;

	var positionen = retrieveBudgetantragPositionen(budgetantragid, false);
	if (positionen === null) return;

	var data = {
		"geschaeftsjahr_kurzbz": global_inputparams.geschaeftsjahr,
		"kostenstelle_id": global_inputparams.kostenstelle,
		"bezeichnung": budgetantrag.bezeichnung,
		"positionen": positionen
	};

	addBudgetantragAjax(data, budgetantragid);
}

/**
 * Updates Budgetpositionen for a given Budgetantrag. this includes adding, editing and deleting budgetpositionen!
 * Accesses global arrays for getting current state for the budgetantrag, creates and passes 3 arrays,
 * each for adding, updating and deleting, to ajax update funcion
 * @param budgetantragid
 */
function updateBudgetpositionen(budgetantragid)
{
	var positionen = retrieveBudgetantragPositionen(budgetantragid, true);

	if (positionen === null) return;

	var positionenToAdd = [], positionenToUpdate = [], positionenToDelete = [];

	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);

	var idsToAdd = budgetantrag.positionentoadd;
	var idsToDelete = budgetantrag.positionentodelete;

	for (var i = 0; i < positionen.length; i++)
	{
		var position = positionen[i];
		var positionid = position.budgetposition_id;

		if (findInArray(idsToAdd, positionid) !== false)
		{
			positionenToAdd.push(position.position);
			continue;
		}

		var initialPosition = findInArray(budgetantrag.positionen, positionid);

		//updated if it is in existentBudgetantraege, has changed, and is not going to be deleted anyway
		if (initialPosition !== false && checkIfBudgetpositionFormChanged(initialPosition, positionid) && !findInArray(idsToDelete, positionid))
			positionenToUpdate.push(position);
	}

	for (var i = 0; i < idsToDelete.length; i++)
		positionenToDelete.push({"budgetposition_id": idsToDelete[i].id});

	var data = {
		"positionentoadd": positionenToAdd,
		"positionentoupdate": positionenToUpdate,
		"positionentodelete": positionenToDelete
	};

	console.log(data);
	if (positionenToAdd.length > 0 || positionenToUpdate.length > 0 || positionenToDelete.length > 0)
	{
		updateBudgetpositionenAjax(budgetantragid, data);
	}
}

/**
 * Initializes deletion of a Budgetantrag
 * @param budgetantragid
 */
function deleteBudgetantrag(budgetantragid)
{
	if (findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid) !== false)
		deleteBudgetantragAjax(budgetantragid);
}

// -----------------------------------------------------------------------------------------------------------------
// Ajax callbacks (called after ajax execution)

/**
 * Executes after Ajax for getting all Budgetanträge is finished.
 * @param budgetantragid
 * @param oldid
 */
function afterBudgetantraegeGet(data)
{
	global_budgetantraege.existentBudgetantraege = [];

	for (var i = 0; i < data.length; i++)
	{
		var budgetantrag = data[i];
		addAntragToExistingAntraegeArray(budgetantrag);
	}
	$("#budgetantraege").empty();
	appendBudgetantraege(data);
	calculateBudgetantragSums();
}

/**
 * Executes after Ajax for adding Budgetantrag is finished. Updates Budgetantrag by calling Ajax.
 * @param budgetantragid
 * @param oldid
 */
function afterBudgetantragAdd(budgetantragid, oldid)
{
	//update Budgetantragid in the view to the id of newly added Antrag
	$("#"+budgetantragPrefix+"_"+oldid).attr("id", budgetantragPrefix+"_"+budgetantragid);
	getBudgetantragAjax(budgetantragid);
}

/**
 * Executes after Ajax for getting a single Budgetantrag is finished, for refreshing html and array.
 * @param budgetantragid
 * @param oldid
 */
function afterBudgetantragGet(data)
{
	if (data[0].budgetantrag_id !== null)
		addAntragToExistingAntraegeArray(data[0]);
	refreshBudgetantrag(data[0].budgetantrag_id, data[0]);
	calculateBudgetantragSums();
}

// -----------------------------------------------------------------------------------------------------------------
// Other Modifiers (handle global array update and/or call view functions for appending/modifying html)

/**
 * Appends new Budgetantrag to html
 * @param budgetantragid
 */
function appendNewBudgetantrag(budgetantragid)
{
	var passed = checkBudgetantragDataBeforeAdd();
	if (passed === false) return;

	collapseAllBudgetantraege();

	global_budgetantraege.newBudgetantraege.push({"id": budgetantragid, "bezeichnung": passed, "positionen": []});
	global_counters.countNewAntraege++;

	appendBudgetantrag(budgetantragid, passed, 0, true);
	appendNewBudgetposition(budgetantragid);
	appendBudgetantragFooter(budgetantragid, true);
}

/**
 * Appends new Budgetposition to html of a Budgetantrag
 * @param budgetantragid
 */
function appendNewBudgetposition(budgetantragid)
{
	var positionid = newPositionPrefix+global_counters.countNewPosition;
	var newbudgetantrag = findInArray(global_budgetantraege.newBudgetantraege, budgetantragid);
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);

	if (newbudgetantrag !== false)
		newbudgetantrag.positionen.push({"id": positionid});
	else if (budgetantrag !== false)
		budgetantrag.positionentoadd.push({"id": positionid});

	appendBudgetposition(budgetantragid, positionid, null, true);
	global_counters.countNewPosition++;
}

/**
 * Saves Position to be removed from a Budgetantrag
 * @param budgetantragid
 * @param positionid
 */
function deleteBudgetposition(budgetantragid, positionid)
{
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);
	if (budgetantrag === false) return;

	var budgetposition = findInArray(budgetantrag.positionen, positionid);
	if (budgetposition === false) return;

	budgetantrag.positionentodelete.push({"id": positionid});
}

/**
 * Adds Budgetantrag to existentBudgetantraege array if its a new Antrag,
 * updates positions of the array if the Antrag already exists
 * @param budgetantragToAdd
 */
function addAntragToExistingAntraegeArray(budgetantragToAdd)
{
	var newBudgetantragId = budgetantragToAdd.budgetantrag_id;
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, newBudgetantragId);

	var updatedPositionen = [];
	for (var i = 0; i < budgetantragToAdd.budgetpositionen.length; i++)
	{
		var position = budgetantragToAdd.budgetpositionen[i];
		var betrag = position.betrag === null ? 0 : parseFloat(position.betrag);
		updatedPositionen.push({"id": position.budgetposition_id, "betrag": betrag});
	}

	var budgetantragData = {
		"id": newBudgetantragId,
		"positionen": updatedPositionen,
		"positionentoadd": [],
		"positionentodelete": []
	};

	if (budgetantrag === false)
	{
		global_budgetantraege.existentBudgetantraege.push(budgetantragData);
	}
	else
	{
		budgetantrag.positionen = budgetantragData.positionen;
	}
}

// -----------------------------------------------------------------------------------------------------------------
// Helper functions

/**
 * Saves the initial state of a form, i.e. user input when the form was loaded.
 * Needed for later check if form has been modified by user.
 * @param budgetantragid
 * @param budgetpositionid
 */
function saveInitialFormState(budgetantragid, budgetpositionid)
{
	var budgetantrag = findInArray(global_budgetantraege.existentBudgetantraege, budgetantragid);
	if (budgetantrag === false) return;

	var budgetposition = findInArray(budgetantrag.positionen, budgetpositionid);
	if (budgetposition === false) return;

	budgetposition.initialForm = $("#form_" + budgetpositionid).serialize();
}

/**
 * calculates sums (saved, freigegeben...)
 */
function calculateBudgetantragSums()
{
	var sums = {"savedsum": 0};
	for (var i = 0; i < global_budgetantraege.existentBudgetantraege.length; i++)
	{
		var budgetantrag = global_budgetantraege.existentBudgetantraege[i];
		for (var j = 0; j < budgetantrag.positionen.length; j++)
		{
			var betrag = budgetantrag.positionen[j].betrag;
			if (betrag !== null)
				sums.savedsum += budgetantrag.positionen[j].betrag;
		}
	}

	setTotalSums(sums);
}