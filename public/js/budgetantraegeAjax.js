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
		url: './Budgetantrag/getProjekte',
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}

function getKontenAjax()
{
	return $.ajax({
		type: "GET",
		dataType: "json",
		url: './Budgetantrag/getKonten',
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
		url: './Budgetantrag/getBudgetantraege/'+geschaeftsjahr+'/'+kostenstelle,
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

function getBudgetantragAjax(budgetantragid)
{
	$.ajax({
		type: "GET",
		dataType: "json",
		url: './Budgetantrag/getBudgetantrag/'+budgetantragid,
		success: function (data, textStatus, jqXHR)
		 {
		 	afterBudgetantragGet(data);
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
		url: './Budgetantrag/newBudgetantrag',
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
		url: './Budgetantrag/updateBudgetantragPositionen/'+budgetantragid,
		success: function (data, textStatus, jqXHR)
		{
			getBudgetantragAjax(budgetantragid);
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
		url: './Budgetantrag/deleteBudgetantrag/'+budgetantragid,
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
