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

	$("#searchmodekst").click(
		function()
		{
			BudgetantraegeUebersicht.searchMode = "KST";
			$("#searchmode").text("KST");
			BudgetantraegeUebersicht._initSearch();
		}
	);

	$("#searchmodeoe").click(
		function()
		{
			BudgetantraegeUebersicht.searchMode = "OE";
			$("#searchmode").text("OE");
			BudgetantraegeUebersicht._initSearch();
		}
	);

	$("#budgetsearch").keyup(
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
	 * Recursively generates html string for the treegrid which can be passed to jquerytree plugin
	 * @param oeitem
	 * @param parent
	 * @returns {string}
	 * @private
	 */
	_printOeTreeItem: function (oeitem, parent)
	{

		var parentclass = parent === null ? "" :  " data-tt-parent-id='"+parent+"'";

		var strTree = "<tr data-tt-id='"+oeitem.oe_kurzbz+"'"+parentclass+">" +
			"<td>"+oeitem.bezeichnung+"</td>" +
			"<td class='text-center'>"+BudgetantraegeLib.formatDecimalGerman(oeitem.budgetsumme)+"</td>" +
			"<td class='text-center'>"+BudgetantraegeLib.formatDecimalGerman(oeitem.genehmigtsumme)+"</td>";

		for (var i = 0; i < oeitem.kostenstellen.length; i++)
		{
			var kostenstelle = oeitem.kostenstellen[i];
			var inactivetext = kostenstelle.aktiv === true ? "" : " (inaktiv)";
			var inactiveclass = kostenstelle.aktiv === true ? "" : " inactivekostenstelle";
			strTree += "<tr data-tt-id='kst_" + kostenstelle.kostenstelle_id + "' data-tt-parent-id='"+oeitem.oe_kurzbz+"' class='kostenstellerow"+inactiveclass+"' id='kst_"+kostenstelle.kostenstelle_id+"'>" +
				"<td><i class='fa fa-euro' title='Kostenstelle'></i> "+kostenstelle.bezeichnung+inactivetext+"</td>"+
				"<td class='text-center'>"+BudgetantraegeLib.formatDecimalGerman(kostenstelle.budgetsumme)+"</td>"+
				"<td class='text-center'>"+BudgetantraegeLib.formatDecimalGerman(kostenstelle.genehmigtsumme)+"</td>"+
				"</tr>";

			//add to totals
			if (kostenstelle.budgetsumme !== null)
				BudgetantraegeUebersicht.sums.gesamt += parseFloat(kostenstelle.budgetsumme);
			if (kostenstelle.genehmigtsumme !== null)
				BudgetantraegeUebersicht.sums.genehmigt += parseFloat(kostenstelle.genehmigtsumme);
		}

		for (var i = 0; i < oeitem.children.length; i++)
			strTree += BudgetantraegeUebersicht._printOeTreeItem(oeitem.children[i], oeitem.oe_kurzbz)

		return strTree;
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

		BudgetantraegeUebersicht.searchResultArray = [];

		var expansionlevel = null;

		if (BudgetantraegeUebersicht.searchMode === "KST")
		{
			BudgetantraegeUebersicht._filterKst(searchterm, BudgetantraegeUebersicht.kostenstellentree, BudgetantraegeUebersicht.searchResultArray);
			expansionlevel = 2;
		}
		else if (BudgetantraegeUebersicht.searchMode === "OE")
		{
			BudgetantraegeUebersicht._filterOe(searchterm, BudgetantraegeUebersicht.kostenstellentree);
			expansionlevel = 1;
		}

		BudgetantraegeUebersicht._printTree(BudgetantraegeUebersicht.searchResultArray, BudgetantraegeUebersicht.geschaeftsjahr, expansionlevel);
	},

	/**
	 * Filters Tree by Organisationseinheit (shows only Organisationsheit without hierarchy)
	 * @param oebez
	 * @param oearr
	 * @private
	 */
	_filterOe: function(oebez, oearr)
	{
		for (var i = 0; i < oearr.length; i++)
		{
			if (BudgetantraegeUebersicht._compareCaseInsensitive(oearr[i].bezeichnung, oebez) >= 0)
				BudgetantraegeUebersicht.searchResultArray.push(oearr[i]);
			else
				BudgetantraegeUebersicht._filterOe(oebez, oearr[i].children);
		}
	},

	/**
	 * Filters tree by Kostenstellen (shows Kostenstellen with hierarchy
	 * @param kstbez
	 * @param oearr
	 * @param targetarr
	 * @private
	 */
	_filterKst: function(kstbez, oearr, targetarr)
	{
		for (var i = 0; i < oearr.length; i++)
		{
			var oeel = oearr[i];
			var foundkst = [];
			var foundkstfirstlevel = [];
			var budgetsumme = 0.00;
			var genehmigtsumme = 0.00;

			BudgetantraegeUebersicht._getAllKstChildren(oeel, kstbez, foundkstfirstlevel, foundkst, true);

			// hard copy oe if it has Kostenstellen
			if (foundkst.length > 0)
			{

/*				for (var j = 0; j < oeel.kostenstellen.length; j++)
				{
					var kst = oeel.kostenstellen[j];

					if (BudgetantraegeUebersicht._compareCaseInsensitive(kst.bezeichnung, kstbez) >= 0)
					{
						console.log(kst);
						//budgetsumme += kst.budgetsumme;
						//genehmigtsumme += kst.genehmigtsumme;
						foundKst.push(kst);
					}
				}*/

				var length = foundkst.length;

				for (var k = 0; k < foundkst.length; k++)
				{
					if (foundkst[k].budgetsumme !== null)
						budgetsumme += parseFloat(foundkst[k].budgetsumme);
					if (foundkst[k].genehmigtsumme !== null)
						genehmigtsumme += parseFloat(foundkst[k].genehmigtsumme);
				}

				var copy = {
					bezeichnung: oeel.bezeichnung,
					budgetsumme: budgetsumme,
					genehmigtsumme: genehmigtsumme,
					oe_kurzbz: oeel.oe_kurzbz,
					kostenstellen: foundkstfirstlevel,
					children: []
				};

				targetarr.push(copy);

				BudgetantraegeUebersicht._filterKst(kstbez, oeel.children, targetarr[targetarr.length - 1].children);
			}
		}
	},

	/**
	 * Gets all Kostenstellen that are under a given oe (children)
	 * that contain kstbez
	 * @param oe
	 * @param kstbez
	 * @param foundkstfirstlevel array containing all direct children of the oe
	 * @param foundkst array containing all children (children, grandchildren...) of the oe
	 * @param firstlevel wether the first level of children is searched (first iteration)
	 * @returns {*} array with all found Kostenstellen
	 * @private
	 */
	_getAllKstChildren: function(oe, kstbez, foundkstfirstlevel, foundkst, firstlevel)
	{
		for (var i = 0; i < oe.kostenstellen.length; i++)
		{
			if (BudgetantraegeUebersicht._compareCaseInsensitive(oe.kostenstellen[i].bezeichnung, kstbez) >= 0)
			{
				if (firstlevel)
					foundkstfirstlevel.push(oe.kostenstellen[i]);

				foundkst.push(oe.kostenstellen[i]);
			}
		}

		firstlevel = false;

		for (var j = 0; j < oe.children.length; j++)
		{
			var child = oe.children[j];
			BudgetantraegeUebersicht._getAllKstChildren(child, kstbez, foundkstfirstlevel, foundkst, firstlevel);
		}

		return foundkst;
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
	 * Compares two kst caseinsensitively
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
