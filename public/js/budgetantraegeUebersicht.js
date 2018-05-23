/**
 * javascript file for Budgetuebersicht, which shows Kostenstellen with their Organisationseinheiten in a treegrid view
 */

const CONTROLLER_URL = FHC_JS_DATA_STORAGE_OBJECT.app_root + FHC_JS_DATA_STORAGE_OBJECT.ci_router + "/"+FHC_JS_DATA_STORAGE_OBJECT.called_path;
const EXTENSION_URL = CONTROLLER_URL.replace("BudgetantragUebersicht", "");
var global_sums = {"gesamt": 0.00, "genehmigt": 0.00};

$(document).ready(
	function ()
	{
		var sessionGj = sessionStorage.getItem("budgetgeschaeftsjahr");

		if (sessionGj !== null && typeof(Storage) !== "undefined")
		{
			geschaeftsjahr = sessionGj;
			$("#geschaeftsjahr").val(geschaeftsjahr);
		}

		var geschaeftsjahr = $("#geschaeftsjahr").val();

		getKostenstellenTreeAjax(geschaeftsjahr);

		$("#geschaeftsjahr").change(
			function ()
			{
				//$("#gjgroup").removeClass("has-error");
				var geschaeftsjahr = $(this).val();

				if (typeof(Storage) !== "undefined") {
					sessionStorage.setItem("budgetgeschaeftsjahr", geschaeftsjahr);
				}

				getKostenstellenTreeAjax(geschaeftsjahr);
			}
		);
	}
);

/**
 * Recursively generates html string for the treegrid which can be passed to jquerytree plugin
 * @param oeitem
 * @param parent
 * @returns {string}
 */
function printOeTreeItem(oeitem, parent)
{

	var parentclass = parent === null ? "" :  " data-tt-parent-id='"+parent+"'";

	var strTree = "<tr data-tt-id='"+oeitem.oe_kurzbz+"'"+parentclass+">" +
		"<td>"+oeitem.bezeichnung+"</td>" +
		"<td class='text-center'>"+formatDecimalGerman(oeitem.budgetsumme)+"</td>" +
		"<td class='text-center'>"+formatDecimalGerman(oeitem.genehmigtsumme)+"</td>";

	for (var i = 0; i < oeitem.kostenstellen.length; i++)
	{
		var kostenstelle = oeitem.kostenstellen[i];
		var inactivetext = kostenstelle.aktiv === true ? "" : " (inaktiv)";
		var inactiveclass = kostenstelle.aktiv === true ? "" : " inactivekostenstelle";
		strTree += "<tr data-tt-id='kst_" + kostenstelle.kostenstelle_id + "' data-tt-parent-id='"+oeitem.oe_kurzbz+"' class='kostenstellerow"+inactiveclass+"' id='kst_"+kostenstelle.kostenstelle_id+"'>" +
			"<td><i class='fa fa-euro' title='Kostenstelle'></i> "+kostenstelle.bezeichnung+inactivetext+"</td>"+
			"<td class='text-center'>"+formatDecimalGerman(kostenstelle.budgetsumme)+"</td>"+
			"<td class='text-center'>"+formatDecimalGerman(kostenstelle.genehmigtsumme)+"</td>"+
			"</tr>";

		//add to totals
		if (kostenstelle.budgetsumme !== null)
			global_sums.gesamt += parseFloat(kostenstelle.budgetsumme);
		if (kostenstelle.genehmigtsumme!== null)
			global_sums.genehmigt += parseFloat(kostenstelle.genehmigtsumme);
	}

	for (var i = 0; i < oeitem.children.length; i++)
		strTree += printOeTreeItem(oeitem.children[i], oeitem.oe_kurzbz)

	return strTree;
}

/**
 * Refreshes total sums at bottom of treegrid
 */
function refreshSums()
{
	$("#summegesamt").text(formatDecimalGerman(global_sums.gesamt));
	$("#summegenehmigt").text(formatDecimalGerman(global_sums.genehmigt));
}

/*------------------------------------------------ AJAX CALLS --------------------------------------------------------*/

function getKostenstellenTreeAjax(geschaeftsjahr)
{
	$.ajax({
		type: "GET",
		dataType: "json",
		url: CONTROLLER_URL+"/getKostenstellenTree/"+encodeURIComponent(geschaeftsjahr),
		success: function (data, textStatus, jqXHR)
		{
			if (data.error === 1)
				return;

			global_sums.genehmigt = 0;
			global_sums.gesamt = 0;

			var kostenstellentree = data.retval;
			var treehtmlstring = "";

			for (var i = 0; i < kostenstellentree.length; i++)
			{
				treehtmlstring += printOeTreeItem(kostenstellentree[i]);
			}

			$("#ksttree tbody").html(treehtmlstring);

			refreshSums();

			$("#ksttree").treetable(
				{
					expandable: true,
					indent: 32
				}, true //true forces reinitialization of the tree
			);

			var allelements = $("#ksttree tbody tr");

			// make kostenstelle clickable, redirect to verwalten
			for (var i = 0; i < allelements.length; i++)
			{
				var element = allelements[i];
				var id = element.id;
				if (id.indexOf("kst_") !==  -1)
				{
					$(element).click(
						function ()
						{
							var elid = this.id;
							var kostenstelleid = elid.substr(elid.indexOf("_") + 1);
							//window.open(EXTENSION_URL + "Budgetantrag/showVerwalten/" + encodeURIComponent(geschaeftsjahr) + "/" + encodeURIComponent(kostenstelleid), "_blank");
							window.location = EXTENSION_URL + "Budgetantrag/showVerwalten/" + encodeURIComponent(geschaeftsjahr) + "/" + encodeURIComponent(kostenstelleid);
						}
					)
				}

				// expand first level nodes
				if ($(element).attr("data-tt-parent-id") === "undefined")
					$("#ksttree").treetable("expandNode", $(element).attr("data-tt-id"));
			}
		},
		error: function (jqXHR, textStatus, errorThrown)
		{
			alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
		}
	});
}