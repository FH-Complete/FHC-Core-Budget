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
 * javascript file for Ajax calls to controller of Budgetantraege
 */

function getProjekteAjax()
{
	return $.ajax({
		type: "GET",
		dataType: "json",
		url: FULL_URL+"/getProjekte",/*'./Budgetantrag/getProjekte',*/
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function getKontenAjax(kostenstelle)
{
	return $.ajax({
		type: "GET",
		dataType: "json",
		url: FULL_URL+"/getKonten/"+kostenstelle,
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function checkIfCurrGeschaeftsjahrAjax(geschaeftsjahr)
{
	return $.ajax({
		type: "GET",
		dataType: "json",
		url: FULL_URL+"/checkIfCurrentGeschaeftsjahr/"+geschaeftsjahr,
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function checkIfKstGenehmigbarAjax(kostenstelle)
{
	return $.ajax({
		type: "GET",
		dataType: "json",
		url: FULL_URL+"/checkIfKostenstelleGenehmigbar/"+kostenstelle,
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function getKostenstellenAjax(geschaeftsjahr)
{
	return $.ajax({
		type: "GET",
		dataType: "json",
		url: FULL_URL+"/getKostenstellen/"+geschaeftsjahr,
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function getBudgetantraegeAjax(geschaeftsjahr, kostenstelle)
{
  	$.ajax({
		type: "GET",
		dataType: "json",
		url: FULL_URL+"/getBudgetantraege/"+geschaeftsjahr+'/'+kostenstelle,
		success: function (data, textStatus, jqXHR)
		{
			afterBudgetantraegeGet(data);
		},
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

/**
 * Ajax call for retrieving a single Budgetantrag. Aftert execution, updates of view are triggered.
 * Called each time a Budgetantrag is updated
 * @param budgetantragid
 * @param updatetype type of Budgetantrag update (e.g. save, status change...)
 */
function getBudgetantragAjax(budgetantragid, updatetype)
{
	$.ajax({
		type: "GET",
		dataType: "json",
		url: FULL_URL+"/getBudgetantrag/"+budgetantragid,
		success: function (data, textStatus, jqXHR)
		 {
		 	afterBudgetantragGet(data, budgetantragid, updatetype);
		 },
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function addBudgetantragAjax(data, oldid)
{
	$.ajax({
		type: "POST",
		dataType: "json",
		url: FULL_URL+"/newBudgetantrag",
		data: data,
		success: function (data, textStatus, jqXHR)
		{
			afterBudgetantragAdd(data, oldid);
		},
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function updateBudgetpositionenAjax(budgetantragid, data)
{
	$.ajax({
		type: "POST",
		dataType: "json",
		data: data,
		url: FULL_URL+"/updateBudgetantragPositionen/"+budgetantragid,
		success: function (data, textStatus, jqXHR)
		{
			afterBudgetantragUpdate(data, budgetantragid);
		},
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function deleteBudgetantragAjax(budgetantragid)
{
	$.ajax({
		type: "POST",
		dataType: "json",
		url: FULL_URL+"/deleteBudgetantrag/"+budgetantragid,
		success: function (data, textStatus, jqXHR)
		{
			afterBudgetantragDelete(data);
		},
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function updateBudgetantragStatusAjax(budgetantragid, statuskurzbz)
{
	$.ajax({
		type: "POST",
		dataType: "json",
		url: FULL_URL+"/updateBudgetantragStatus/"+budgetantragid+"/"+statuskurzbz,
		success: function (data, textStatus, jqXHR)
		{
			afterBudgetantragStatusChange(budgetantragid, data);
		},
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}
