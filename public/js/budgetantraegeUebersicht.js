/**
 * javascript file for Budgetuebersicht, which shows Kostenstellen with their Organisationseinheiten in a treegrid view
 */

const CALLED_PATH = FHC_JS_DATA_STORAGE_OBJECT.called_path;
const CONTROLLER_URL = FHC_JS_DATA_STORAGE_OBJECT.app_root + FHC_JS_DATA_STORAGE_OBJECT.ci_router + "/"+FHC_JS_DATA_STORAGE_OBJECT.called_path;
const EXTENSION_URL = CONTROLLER_URL.replace("BudgetantragUebersicht", "");

$(document).ready(function () {
	var sessionGj = sessionStorage.getItem("budgetgeschaeftsjahr");

	if (sessionGj !== null && typeof(Storage) !== "undefined")
	{
		var geschaeftsjahr = sessionGj;
		$("#geschaeftsjahr").val(geschaeftsjahr);
	}

	BudgetantraegeUebersicht.geschaeftsjahr = $("#geschaeftsjahr").val();

	BudgetantraegeUebersicht.getKostenstellenTree(BudgetantraegeUebersicht.geschaeftsjahr);

	$("#geschaeftsjahr").change(
		function ()
		{
			BudgetantraegeUebersicht.geschaeftsjahr = $(this).val();

			if (typeof(Storage) !== "undefined") {
				sessionStorage.setItem("budgetgeschaeftsjahr", BudgetantraegeUebersicht.geschaeftsjahr);
			}

			BudgetantraegeUebersicht.getKostenstellenTree(BudgetantraegeUebersicht.geschaeftsjahr);
		}
	);

	$("#budgetsearch").on('input',
		BudgetantraegeUebersicht._initSearch
	);

	$("#collall").click(
		BudgetantraegeUebersicht._collapseAll
	);

	$("#expall").click(
		BudgetantraegeUebersicht._expandAll
	);
});

var BudgetantraegeUebersicht = {
	/*------------------------------------------------ VARIABLES --------------------------------------------------------*/
	searchResultArray: [],
	searchMode: "KST",
	sums:  {"gesamt": 0.00, "genehmigt": 0.00},

	/*------------------------------------------------ AJAX CALLS -------------------------------------------------------*/
	getKostenstellenTree: function (geschaeftsjahr)
	{
		FHC_AjaxClient.ajaxCallGet(
			CALLED_PATH + "/getKostenstellenTree/"+encodeURIComponent(geschaeftsjahr),
			null,
			{
				successCallback: function(data, textStatus, jqXHR)
				{
					if (!FHC_AjaxClient.hasData(data))
						return;
					BudgetantraegeUebersicht.kostenstellentree = data.retval;
					BudgetantraegeUebersicht._printTree(BudgetantraegeUebersicht.kostenstellentree, geschaeftsjahr, 1)
				},
				errorCallback: function (jqXHR, textStatus, errorThrown)
				{
					alert(textStatus + " - " + errorThrown + " - " + jqXHR.responseText);
				}
			}
		);
	},

	/*------------------------------------------------ "PRIVATE" METHODS ------------------------------------------------*/

	/**
	 * Recursively generates html string for the treegrid which can be passed to jquerytree plugin
	 * @param oeitem
	 * @param parent
	 * @returns {string}
	 * @private
	 */
	_printOeTreeItem: function (oeitem, parent)
	{
		if (oeitem.children.length >= 1 || oeitem.kostenstellen.length >= 1)
		{
			var parentclass = parent === null ? "" : " data-tt-parent-id='" + parent + "'";

			// print oe
			var strTree = "<tr data-tt-id='" + oeitem.oe_kurzbz + "'" + parentclass + " class='oerow'>" +
				"<td>" + oeitem.bezeichnung + "</td>" +
				"<td class='text-center'>" + BudgetantraegeLib.formatDecimalGerman(oeitem.budgetsumme) + "</td>" +
				"<td class='text-center'>" + BudgetantraegeLib.formatDecimalGerman(oeitem.genehmigtsumme) + "</td>";

			// print children oes
			for (var i = 0; i < oeitem.children.length; i++)
				strTree += BudgetantraegeUebersicht._printOeTreeItem(oeitem.children[i], oeitem.oe_kurzbz)

			// print kostenstellen
			for (var i = 0; i < oeitem.kostenstellen.length; i++)
			{
				var kostenstelle = oeitem.kostenstellen[i];
				var inactivetext = kostenstelle.aktiv === true ? "" : " (inaktiv)";
				var inactiveclass = kostenstelle.aktiv === true ? "" : " inactivekostenstelle";
				strTree += "<tr data-tt-id='kst_" + kostenstelle.kostenstelle_id + "' data-tt-parent-id='" + oeitem.oe_kurzbz + "' class='kostenstellerow" + inactiveclass + "' id='kst_" + kostenstelle.kostenstelle_id + "'>" +
					"<td><i class='fa fa-euro' title='Kostenstelle'></i> " + kostenstelle.bezeichnung + inactivetext + "</td>" +
					"<td class='text-center'>" + BudgetantraegeLib.formatDecimalGerman(kostenstelle.budgetsumme) + "</td>" +
					"<td class='text-center'>" + BudgetantraegeLib.formatDecimalGerman(kostenstelle.genehmigtsumme) + "</td>" +
					"</tr>";

				//add to totals
				if (kostenstelle.budgetsumme !== null)
					BudgetantraegeUebersicht.sums.gesamt += parseFloat(kostenstelle.budgetsumme);
				if (kostenstelle.genehmigtsumme !== null)
					BudgetantraegeUebersicht.sums.genehmigt += parseFloat(kostenstelle.genehmigtsumme);
			}
		}

		return strTree;
	},

	/**
	 * Prints Organisationseinheiten Tree with Kostenstellen
	 * @param data array with oes, each having Kostenstellen and Children
	 * @param geschaeftsjahr
	 * @param expansionlevel to what degree to expand the tree nodes, 0 - only root nod3es,
	 * 1 - root + first level, 2 - all nodes
	 * @private
	 */
	_printTree: function (data, geschaeftsjahr, expansionlevel)
	{
		BudgetantraegeUebersicht.sums.genehmigt = 0;
		BudgetantraegeUebersicht.sums.gesamt = 0;

		var kostenstellentree = data;

		var treehtmlstring = "";

		for (var i = 0; i < kostenstellentree.length; i++)
		{
			treehtmlstring += BudgetantraegeUebersicht._printOeTreeItem(kostenstellentree[i]);
		}

		$("#ksttree tbody").html(treehtmlstring);

		BudgetantraegeUebersicht._refreshSums();

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
			if (id.indexOf("kst_") !== -1)
			{
				$(element).click(
					function ()
					{
						var elid = this.id;
						var kostenstelleid = elid.substr(elid.indexOf("_") + 1);
						window.location = EXTENSION_URL + "Budgetantrag/showVerwalten/" + encodeURIComponent(geschaeftsjahr) + "/" + encodeURIComponent(kostenstelleid);
					}
				)
			}

			if (expansionlevel === 1)
			{
				if ($(element).attr("data-tt-parent-id") === "undefined")
					$("#ksttree").treetable("expandNode", $(element).attr("data-tt-id"));
			}
		}

		if (expansionlevel === 0)
		{
			BudgetantraegeUebersicht._collapseAll();
		}
		else if (expansionlevel === 2)
		{
			BudgetantraegeUebersicht._expandAll();
		}
	},

	/**
	 * Refreshes total sums at bottom of treegrid
	 * @private
	 */
	_refreshSums: function()
	{
		$("#summegesamt").text(BudgetantraegeLib.formatDecimalGerman(BudgetantraegeUebersicht.sums.gesamt));
		$("#summegenehmigt").text(BudgetantraegeLib.formatDecimalGerman(BudgetantraegeUebersicht.sums.genehmigt));
	},

	_collapseAll: function()
	{
		if (!BudgetantraegeUebersicht._checkTableData())
			return;
		$("#ksttree").treetable("collapseAll");
	},

	_expandAll: function()
	{
		if (!BudgetantraegeUebersicht._checkTableData())
			return;
		$("#ksttree").treetable("expandAll");
	},

	/**
	 * Initializes search in tree
	 * @private
	 */
	_initSearch: function()
	{
		var searchterm = $("#budgetsearch").val();

		if (!BudgetantraegeUebersicht._checkTableData())
			return;

		if (!searchterm)
		{
			BudgetantraegeUebersicht._printTree(BudgetantraegeUebersicht.kostenstellentree, BudgetantraegeUebersicht.geschaeftsjahr, 1);
			return;
		}

		$("#ksttree tr").css("font-weight", "normal");

		BudgetantraegeUebersicht._collapseAll();

		BudgetantraegeUebersicht._searchKstAndOe(BudgetantraegeUebersicht.kostenstellentree, searchterm);
	},
	/**
	 * Searches for searchterm in OEs and Kostenstellen. Marks those found as bold.
	 * @param oearr with OEs and their Kostenstellen
	 * @param searchterm
	 * @private
	 */
	_searchKstAndOe: function(oearr, searchterm)
	{

		for (var i = 0; i < oearr.length; i++)
		{
			var oeel = oearr[i];

			if (BudgetantraegeUebersicht._checkIfHasChild(oeel, searchterm))
			{
				$("tr[data-tt-id="+oeel.oe_kurzbz+"]").css("font-weight", "bold");
				$("#ksttree").treetable("expandNode", oeel.oe_kurzbz);
			}

			BudgetantraegeUebersicht._searchKstAndOe(oeel.children, searchterm);
		}
	},

	/**
	 * Checks if an OE has children (OEs or Kostenstellen)
	 * @param parent the parent OE
	 * @param searchterm
	 * @returns boolean indicating if searchterm is found in children
	 * @private
	 */
	_checkIfHasChild: function(parent, searchterm)
	{
		var hasChild = false;

		if (BudgetantraegeUebersicht._compareCaseInsensitive(parent.bezeichnung, searchterm) >= 0)
		{
			hasChild = true;
		}

		for (var j = 0; j < parent.kostenstellen.length; j++)
		{
			if (BudgetantraegeUebersicht._compareCaseInsensitive(parent.kostenstellen[j].bezeichnung, searchterm) >= 0)
			{
				$("tr[data-tt-id=kst_"+parent.kostenstellen[j].kostenstelle_id+"]").css("font-weight", "bold");
				hasChild = true;
			}
		}

		if (hasChild === true) return hasChild;

		for (var i = 0; i < parent.children.length; i++)
		{
			var oechild = parent.children[i];

			var found = BudgetantraegeUebersicht._checkIfHasChild(oechild, searchterm);
			if (found) return found;
		}

		return false;
	},

	/**
	 * Checks if the treetable contains any data
	 * @returns {boolean}
	 * @private
	 */
	_checkTableData: function()
	{
		return (BudgetantraegeUebersicht.kostenstellentree !== null && typeof BudgetantraegeUebersicht.kostenstellentree !== "undefined");
	},

	/**
	 * Compares two Kostenstellen caseinsensitively
	 * @param kstbez1
	 * @param kstbez2
	 * @returns {Number}
	 * @private
	 */
	_compareCaseInsensitive: function(kstbez1, kstbez2)
	{
		return kstbez1.toLowerCase().indexOf(kstbez2.toLowerCase());
	}
};
