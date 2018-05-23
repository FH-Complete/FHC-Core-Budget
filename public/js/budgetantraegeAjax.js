/**
 * javascript file for Ajax calls to controller of Budgetantraege
 */

function getProjekteAjax()
{
	return $.ajax({
		type: "GET",
		dataType: "json",
		url: CONTROLLER_URL+"/getProjekte",
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
		url: CONTROLLER_URL+"/getKonten/"+encodeURIComponent(kostenstelle),
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
		url: CONTROLLER_URL+"/checkIfCurrentGeschaeftsjahr/"+encodeURIComponent(geschaeftsjahr),
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
		url: CONTROLLER_URL+"/checkIfKostenstelleGenehmigbar/"+encodeURIComponent(kostenstelle),
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
		url: CONTROLLER_URL+"/getKostenstellen/"+encodeURIComponent(geschaeftsjahr),
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
		url: CONTROLLER_URL+"/getBudgetantraege/"+encodeURIComponent(geschaeftsjahr)+'/'+encodeURIComponent(kostenstelle),
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
		url: CONTROLLER_URL+"/getBudgetantrag/"+encodeURIComponent(budgetantragid),
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
		url: CONTROLLER_URL+"/newBudgetantrag",
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
		url: CONTROLLER_URL+"/updateBudgetantragPositionen/"+encodeURIComponent(budgetantragid),
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
		url: CONTROLLER_URL+"/deleteBudgetantrag/"+encodeURIComponent(budgetantragid),
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
		url: CONTROLLER_URL+"/updateBudgetantragStatus/"+encodeURIComponent(budgetantragid)+"/"+encodeURIComponent(statuskurzbz),
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
