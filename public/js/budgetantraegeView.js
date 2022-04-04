/**
 * javascript file for modifying html (DOM) of Budgetanträge view
 */

var BudgetantraegeView = {
	// -----------------------------------------------------------------------------------------------------------------
	// HTML-modifiers (append, remove html)

	/**
	 * Appends Kostenstellen to global Kostenstellen dropdown
	 * @param kostenstellen
	 */
	appendKostenstellen: function(kostenstellen)
	{
		var kostenstelleDom = $("#kostenstelle");

		var prevKostenstelle = kostenstelleDom.val();

		kostenstelleDom.find("option:not([value='null'])").remove();

		for (var i = 0; i < kostenstellen.length; i++)
		{
			var kostenstelle = kostenstellen[i];

			if (!$.isNumeric(kostenstelle.kostenstelle_id))
				continue;

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
	},

	/**
	 * Appends the html before the Budgetantraege panels, i.e. input field for adding new Budgetantrag and sums
	 */
	appendPreBudgetantraegeHtml: function()
	{
		var html = BudgetantraegeHtml.getPreBudgetantragHtml();

		$("#budgetantraegehtml").html(html);

		// add html for "plus" button for showing "add Budgetantrag" button
		var showAddButtonHtml = BudgetantraegeHtml.getShowAddButtonHtml();

		$("#showBudgetantragAddButtonContainer").html(showAddButtonHtml);

		// show Budgetantrag add button when clicking plus button in upper right corner
		$("#showBudgetantragAddButton").click(
			function ()
			{
				BudgetantraegeView.toogleBudgetantraegeAddButtonVisibility();
			}
		);

		$("#addBudgetantrag").click(
			function ()
			{
				BudgetantraegeController.appendNewBudgetantrag(NEW_BUDGET_PREFIX + BudgetantraegeController.global_counters.countNewAntraege);
			}
		);
	},

	/**
	 * Appends an array of Budgetantraege and their Budgetpositions
	 * @param antraege
	 */
	appendBudgetantraege: function(antraege)
	{
		BudgetantraegeView.appendPreBudgetantraegeHtml();
		for (var i = 0; i < antraege.length; i++)
		{
			var budgetantrag = antraege[i];
			var budgetantragid = budgetantrag.budgetantrag_id;

			var editable = BudgetantraegeController.global_booleans.editmode === true
				&& (!budgetantrag.hasOwnProperty('budgetstatus') || GLOBAL_STATUSES[budgetantrag.budgetstatus.budgetstatus_kurzbz].editable === true);
			var freigabeAufhebenBtn = budgetantrag.hasOwnProperty('budgetstatus') && budgetantrag.budgetstatus.budgetstatus_kurzbz === GLOBAL_STATUSES.approved.bez &&
								BudgetantraegeController.global_booleans.editmode === true;
			var footer_args = {"isNewAntrag": false, "freigabeAufhebenBtn": freigabeAufhebenBtn};

			var hidden_budgetantrag_id = $("#budgetantrag_id").val();
			var opened = hidden_budgetantrag_id == budgetantragid;

			BudgetantraegeView.appendBudgetantrag(budgetantragid, {"bezeichnung": budgetantrag.bezeichnung}, 0, 0, opened, editable);

			var sum = 0;
			var erloeseSum = 0;

			for (var j = 0; j < budgetantrag.budgetpositionen.length; j++)
			{
				var position = budgetantrag.budgetpositionen[j];
				var positionid = position.budgetposition_id;

				if (position.betrag !== null)
				{
					if (position.erloese === true)
					{
						erloeseSum += parseFloat(position.betrag);
					}
					else
					{
						sum += parseFloat(position.betrag);
					}
				}

				BudgetantraegeView.appendBudgetposition(budgetantragid, positionid, position, false, editable);

				//save initial state of form for tracking changes
				BudgetantraegeController.saveInitialFormState(budgetantragid, position.budgetposition_id);
			}
			BudgetantraegeView.setBudgetantragStatus(budgetantragid, budgetantrag.budgetstatus);
			BudgetantraegeView.setSum(budgetantragid, sum, erloeseSum);
			BudgetantraegeView.appendBudgetantragFooter(budgetantragid, footer_args, editable);
		}
	},

	/**
	 * Appends a single Budgetantrag
	 * @param budgetantragid
	 * @param data
	 * @param sum - the sum of all positions of the Budgetantrag to append
	 * @param opened - whether the panel for the Budgetantrag is collapsed or opened
	 * @param editable - whether the Budgetantrag is editable or readonly
	 */
	appendBudgetantrag: function(budgetantragid, data, sum, erloeseSum, opened, editable)
	{
		var collapseInHtml = opened === true ? " in" : "";
		var collapseHtml = opened === true ? "" : " collapsed";

		var budgetantrHtml = BudgetantraegeHtml.getBudgetantragHtml({
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

		BudgetantraegeView.setSum(budgetantragid, sum, erloeseSum);

		$("#budgetbezconfirm_" + budgetantragid).click(
			function ()
			{
				var budgetbez = $("#budgetbezinput_"+budgetantragid).val();
				BudgetantraegeController.updateBudgetantragBezeichnung(budgetantragid, budgetbez)
			}
		);

		$("#budgetbezedit_" + budgetantragid).click(
			function ()
			{
				var budgetbez = $("#budgetbezeichnung_"+budgetantragid).text();
				BudgetantraegeView.setBudgetantragBezeichnungEdit(budgetantragid, budgetbez);
			}
		);

		$("#budgetbezinput_"+budgetantragid).keypress(function(event){
			var keycode = event.which;
			if(keycode == '13'){//on enter key press
				var budgetbez = $("#budgetbezinput_"+budgetantragid).val();
				BudgetantraegeController.updateBudgetantragBezeichnung(budgetantragid, budgetbez)
			}
			//Stop the event from propogation to other handlers
			event.stopPropagation();
		});

		$("#addPosition_" + budgetantragid).click(
			function ()
			{
				BudgetantraegeController.appendNewBudgetposition(budgetantragid);
			}
		);

		$("#remove_" + budgetantragid).click(
			function ()
			{
				BudgetantraegeController.deleteBudgetantrag(budgetantragid);
			}
		);
	},

	/**
	 * Appends the footer for a Budgetantrag.
	 * There are different kinds of footers for a new Antrag and an Antrag to update.
	 * @param budgetantragid
	 * @param footer_args
	 * @param editable - whether the Budgetantrag is editable or readonly
	 */
	appendBudgetantragFooter: function(budgetantragid, footer_args, editable)
	{
		var footerel = $("#budgetfooter_" + budgetantragid);

		var html = BudgetantraegeHtml.getBudgetantragFooterHtml({"budgetantragid": budgetantragid, "isNewAntrag": footer_args.isNewAntrag, "freigabeAufhebenBtn": footer_args.freigabeAufhebenBtn}, editable);
		footerel.html(html);

		if (editable === true)
		{
			if (footer_args.isNewAntrag === true)
			{
				$("#save_" + budgetantragid).click(
					function () {
						BudgetantraegeController.addNewBudgetantrag(budgetantragid);
					}
				);
			}
			else
			{
				$("#save_" + budgetantragid).click(
					function () {
						BudgetantraegeController.updateBudgetpositionen(budgetantragid);
					}
				);

				$("#abschicken_" + budgetantragid).click(
					function () {
						BudgetantraegeController.updateBudgetantragStatus(budgetantragid, GLOBAL_STATUSES.sent.bez);
					}
				);

				$("#freigeben_" + budgetantragid).click(
					function () {
						BudgetantraegeController.updateBudgetantragStatus(budgetantragid, GLOBAL_STATUSES.approved.bez);
					}
				);

				$("#ablehnen_" + budgetantragid).click(
					function () {
						BudgetantraegeController.updateBudgetantragStatus(budgetantragid, GLOBAL_STATUSES.rejected.bez);
					}
				);
			}
		}
		else
		{
			if (footer_args.freigabeAufhebenBtn)
			{
				$("#revertfreigabe_" + budgetantragid).click(
					function () {
						BudgetantraegeController.updateBudgetantragStatus(budgetantragid, GLOBAL_STATUSES.new.bez);
					}
				);
			}
		}
	},

	/**
	 * Appends a Budgetposition for a Budgetantrag
	 * @param budgetantragid
	 * @param positionid
	 * @param positionobj - contains position data if it is an existing Budgetposition, null otherwise
	 * @param opened - whether the panel for the Budgetposition is collapsed or opened
	 * @param editable - whether the Budgetposition is editable or readonly
	 */
	appendBudgetposition: function(budgetantragid, positionid, positionobj, opened, editable)
	{
		var positionargs = {
			"positionid": positionid,
			"budgetposten": "",
			"projekt_id": "null",
			"konto_id": "null",
			"betrag": "",
			"benoetigt_am": "null",
			"kommentar": "",
			"erloese": "false",
			"investition": "false",
			"nutzungsdauer": 4
		};

		if (positionobj !== null)
		{
			if (positionobj.bezeichnung !== null) positionargs.budgetposten = positionobj.budgetposten;
			if (positionobj.projekt_id !== null) positionargs.projekt_id = positionobj.projekt_id;
			if (positionobj.konto_id !== null) positionargs.konto_id = positionobj.konto_id;
			if (positionobj.betrag !== null) positionargs.betrag = positionobj.betrag;
			//if null - comes from db and Betrag is auf Jahr verteilt, string null - benoetigt_am has to be entered
			positionargs.benoetigt_am = positionobj.benoetigt_am;
			if (positionobj.kommentar !== null) positionargs.kommentar = positionobj.kommentar;
			if (positionobj.erloese !== null) positionargs.erloese = positionobj.erloese;
			if (positionobj.investition !== null) positionargs.investition = positionobj.investition;
			if (positionobj.nutzungsdauer !== null) positionargs.nutzungsdauer = positionobj.nutzungsdauer;
		}

		positionargs.collapseInHtml = opened === true ? " in" : "";
		positionargs.collapseHtml = opened === true ? "" : " collapsed";

		var html = BudgetantraegeHtml.getBudgetpositionHtml(positionargs, editable);

		$("#budgetPosition_" + budgetantragid).append(html);

		$("#removePosition_" + positionid).click(
			function ()
			{
				BudgetantraegeController.deleteBudgetposition(budgetantragid, positionid);
			}
		);

		//datepicker for benoetigt am field
		var benoetigtamel = $("#benoetigtam_" + positionid);
		var benoetigtamgroup = $("#benoetigtamgroup_" + positionid);
		var nutzungsdauer_group = $("#nutzungsdauer_group_" + positionid);
		benoetigtamel.datepicker();

		$("#jahrverteilen_" + positionid).change(
			function()
			{
				if ($(this).is(":checked"))
				{
					benoetigtamgroup.addClass('hidden');
				}
				else
				{
					benoetigtamgroup.removeClass('hidden');
				}
			}
		);

		$("#investition_" + positionid).change(
			function()
			{
				if ($(this).is(":checked"))
				{
					$("#erloese_" + positionid).prop('disabled', true);
					nutzungsdauer_group.removeClass('hidden');
				}
				else
				{
					$("#erloese_" + positionid).prop('disabled', false);
					nutzungsdauer_group.addClass('hidden');
				}
			}
		);

		$("#erloese_" + positionid).change(
			function()
			{
				if ($(this).is(":checked"))
				{
					$("#investition_" + positionid).prop('disabled', true);
					$("#betragWithCrncy_" + positionid).html('€ 0,00');
					if (positionobj !== null)
						$("#erloeseWithCrncy_" + positionid).html('€ '+BudgetantraegeLib.formatDecimalGerman(positionobj.betrag));
				}
				else
				{
					$("#investition_" + positionid).prop('disabled', false);
					if (positionobj !== null)
						$("#betragWithCrncy_" + positionid).html('€ '+BudgetantraegeLib.formatDecimalGerman(positionobj.betrag));
					$("#erloeseWithCrncy_" + positionid).html('€ 0,00');
				}
			}
		);

		// Events - on change of form show that unsaved
		// Inputs text and textareas
		$("#form_"+positionid).find("input[type=text], textarea").keyup(
			function()
			{
				BudgetantraegeView.checkIfSaved(budgetantragid);
			}
		);

		// Inputs checkbox
		$("#form_"+positionid).find("input[type=checkbox]").change(
			function()
			{
				BudgetantraegeView.checkIfSaved(budgetantragid);
			}
		);

		// Drop-down lists
		$("#form_"+positionid+" select").change(
			function()
			{
				BudgetantraegeView.checkIfSaved(budgetantragid);
			}
		);
	},

	/**
	 * Removes a Budgetposition from the GUI
	 * @param positionid
	 */
	removeBudgetposition: function(positionid)
	{
		$("#" + POSITION_PREFIX + "_" + positionid).remove();
	},

	/**
	 * Refreshes a Budgetantrag after it is updated, includes emptying the Budgetantrag element and appending it again
	 * @param budgetantrag
	 */
	refreshBudgetantrag: function(budgetantrag)
	{
		var budgetantragid = budgetantrag.budgetantrag_id;
		var budgetantragEl = $("#" + BUDGETANTRAG_PREFIX + "_" + budgetantragid);
		var hasStatus = budgetantrag.hasOwnProperty('budgetstatus');
		var statuskurzbz = hasStatus ? budgetantrag.budgetstatus.budgetstatus_kurzbz : null;
		var editable = BudgetantraegeController.global_booleans.editmode === true
			&& (!hasStatus || GLOBAL_STATUSES[statuskurzbz].editable === true);
		var freigabeAufhebenBtn =  hasStatus && statuskurzbz === GLOBAL_STATUSES.approved.bez && BudgetantraegeController.global_booleans.editmode === true;

		budgetantragEl.empty();

		BudgetantraegeView.appendBudgetantrag(budgetantragid, {"bezeichnung": budgetantrag.bezeichnung}, 0, 0, true, editable);

		var sum = 0;
		var erloeseSum = 0;

		for (var i = 0; i < budgetantrag.budgetpositionen.length; i++)
		{
			var position = budgetantrag.budgetpositionen[i];

			if (position.betrag !== null)
			{
				if (position.erloese === true)
				{
					erloeseSum += parseFloat(position.betrag);
				}
				else
				{
					sum += parseFloat(position.betrag);
				}
			}

			BudgetantraegeView.appendBudgetposition(budgetantragid, position.budgetposition_id, position, false, editable);
			BudgetantraegeController.saveInitialFormState(budgetantragid, position.budgetposition_id);
		}
		BudgetantraegeView.setBudgetantragStatus(budgetantragid, budgetantrag.budgetstatus);
		BudgetantraegeView.setSum(budgetantragid, sum, erloeseSum);
		BudgetantraegeView.appendBudgetantragFooter(budgetantragid, {"isNewAntrag": false, "freigabeAufhebenBtn": freigabeAufhebenBtn}, editable);
	},

	/**
	 * Checks if a Budgetantrag is saved, and initializes html modifications accordingly
	 * @param budgetantragid
	 */
	checkIfSaved: function(budgetantragid)
	{
		var budgetantrag = BudgetantraegeLib.findInArray(BudgetantraegeController.global_budgetantraege.existentBudgetantraege, budgetantragid);

		//if not found in existent, assuming it is a new Budgetantrag - not saved yet!
		//if it has new positions - unsaved too
		if (budgetantrag === false || budgetantrag.positionentoadd.length > 0)
		{
			BudgetantraegeView.markUnsaved(budgetantragid);
			return;
		}

		//otherwise set unsaved icon if form changed
		var positionen = budgetantrag.positionen;

		for (var i = 0; i < positionen.length; i++)
		{
			if (BudgetantraegeView.checkIfBudgetpositionFormChanged(positionen[i]))
			{
				BudgetantraegeView.markUnsaved(budgetantragid);
				return;
			}
		}

		BudgetantraegeView.markSaved(budgetantragid);
	},

	/**
	 * Marks a Budgetantrag html as unsaved
	 * @param budgetantragid
	 */
	markUnsaved: function(budgetantragid)
	{
		var savebtn = $("#save_"+budgetantragid);

		$("#unsaved_" + budgetantragid).removeClass("hidden");
		$("#"+BUDGETANTRAG_PREFIX+"_"+budgetantragid+" > .panel-heading > .row").addClass("text-danger");
		BudgetantraegeView.setMessage(budgetantragid, "text-danger", "Budgetantrag noch nicht gespeichert!");
		savebtn.find(".glyphicon-floppy-disk").addClass("text-danger");
		savebtn.css("border-color", "#a94442");
	},

	/**
	 * Marks a Budgetantrag html as saved
	 * @param budgetantragid
	 */
	markSaved: function(budgetantragid)
	{
		var savebtn = $("#save_"+budgetantragid);

		$("#unsaved_" + budgetantragid).addClass("hidden");
		$("#"+BUDGETANTRAG_PREFIX+"_"+budgetantragid+" > .panel-heading > .row").removeClass("text-danger");
		BudgetantraegeView.setMessage(budgetantragid, "", "");
		savebtn.find(".glyphicon-floppy-disk").removeClass("text-danger");
		savebtn.css("border-color", "#adadad");
	},

	/**
	 * Shows Modal for confirmation of deletion of a Budgetantrag
	 * @param budgetantragbezeichnung
	 */
	showDelBudgetantragModal: function(budgetantragbezeichnung)
	{
		$("#delBudgetantragBez").html(budgetantragbezeichnung);
		$("#delAntragModal").modal('show');
	},

	/**
	 * Shows Modal for confirmation of Budgetstatus change
	 * @param statuskurzbz
	 */
	showFrgBudgetantragModal: function (statuskurzbz)
	{
		var modelelement = $("#frgAntragModal");

		if (statuskurzbz === GLOBAL_STATUSES.sent.bez)
			modelelement.find(".modal-body").html(BudgetantraegeHtml.getModalSentHtml());
		else if (statuskurzbz === GLOBAL_STATUSES.new.bez)
			modelelement.find(".modal-body").html(BudgetantraegeHtml.getModalNewHtml());
		else
			modelelement.find(".modal-body").html(BudgetantraegeHtml.getModalApprovedHtml());

		modelelement.find(".frgVerb").html(GLOBAL_STATUSES[statuskurzbz].verb);
		modelelement.find(".frgAdj").html(GLOBAL_STATUSES[statuskurzbz].adj);
		modelelement.modal('show');
	},

	/**
	 * Adds the given sum to a Budgetantrag html
	 * @param budgetantragid
	 * @param sum
	 */
	setSum: function (budgetantragid, sum, erloeseSum)
	{
		$("#sum_" + budgetantragid).text('€ ' + BudgetantraegeLib.formatDecimalGerman(sum));
		$("#erloeseSum_" + budgetantragid).text('€ ' + BudgetantraegeLib.formatDecimalGerman(erloeseSum));
	},

	/**
	 * Adds all sums (gespeichert, freigegeben) to totals table on top
	 * @param sums
	 */
	setTotalSums: function(sums)
	{
		$("#savedSum").text('€ '+BudgetantraegeLib.formatDecimalGerman(sums.savedsum));
		$("#erloeseSavedSum").text('€ '+BudgetantraegeLib.formatDecimalGerman(sums.erloeseSavedSum));
	},

	/**
	 * Sets the bezeichnung of a Budgetantrag in html on edit
	 * @param budgetantragid
	 * @param bezeichnung
	 */
	setBudgetantragBezeichnungEdit: function(budgetantragid, bezeichnung)
	{
		$("#budgetbezeichnung_"+budgetantragid).hide();
		$("#budgetbezedit_"+budgetantragid).hide();
		$("#budgetbezinput_"+budgetantragid).val(bezeichnung);
		$("#budgetbezinputgrp_"+budgetantragid).show();
	},

	/**
	 * Sets the bezeichnung of a Budgetantrag in html after edit confirm
	 * @param budgetantragid
	 * @param bezeichnung
	 */
	setBudgetantragBezeichnungEditConfirm: function(budgetantragid, bezeichnung)
	{
		$("#budgetbezinputgrp_"+budgetantragid).hide();
		$("#budgetbezeichnung_"+budgetantragid).text(bezeichnung);
		$("#budgetbezeichnung_"+budgetantragid).show();
		$("#budgetbezedit_"+budgetantragid).show();
	},

	/**
	 * Sets the status of a Budgetantrag in html
	 * @param budgetantragid
	 * @param status
	 */
	setBudgetantragStatus: function(budgetantragid, status)
	{
		if (typeof status === 'undefined')
			return;

		var statustext = status.bezeichnung + (status.datum === "" ? "" : " am "+BudgetantraegeLib.formatDateGerman(status.datum));
		$("#budgetstatus_"+budgetantragid).text(statustext);
	},

	/**
	 * Adds a message to a Budgetantrag html
	 * @param budgetantragid
	 * @param classname
	 * @param msg
	 */
	setMessage: function(budgetantragid, classname, msg)
	{
		$(".antragMsg").html("");
		$("#msg_"+budgetantragid).html('<span class="'+classname+'">'+msg+'</span>');
	},

	/**
	 * Removes Budgetantrag html for a given id, hides deletemodal
	 * @param budgetantragid
	 */
	removeBudgetantrag: function(budgetantragid)
	{
		$("#delAntragModal").modal('hide');
		$("#" + BUDGETANTRAG_PREFIX + "_" + budgetantragid + " + br").remove();
		$("#" + BUDGETANTRAG_PREFIX + "_" + budgetantragid).remove();
	},

	/**
	 * Removes all Budgetantraege form HTML, including "pre-budgetantraege-html"
	 */
	removeBudgetantraege: function()
	{
		$("#budgetantraegehtml").empty();
	},

	// -----------------------------------------------------------------------------------------------------------------
	// Retrievers (get values from html)

	/**
	 * Retrieves all Budgetpositionen from the Budgetantragform with a given id,
	 * checks if Positiondata is valid before
	 * @param budgetantragid
	 * @param withid specifies format of returnarray: each Position wrapped with id or not
	 * @returns {*} the Budgetpositionen if retrieved successfully, null otherwise (e.g. when wrong input)
	 */
	retrieveBudgetantragPositionen: function(budgetantragid, withid)
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

			var positionFormDom = $(positionForm);

			var positionFields = BudgetantraegeView.checkBudgetpositionDataBeforeAdd(positionFormDom, budgetantragid);

			if (positionFields.error === 1 || !valid)
			{
				for (var j = 0; j < positionFields.data.length; j++)
				{
					if (messages.indexOf(positionFields.data[j]) === -1)
						messages.push(positionFields.data[j]);
				}
				valid = false;
				//mark position header as error
				$("#position_"+position_id+" .panel-heading a.accordion-toggle").addClass("text-danger");
			}

			var positiondata = positionFields.data;

			if (!valid)
				continue;

			positiondata.projekt_id.val = positiondata.projekt_id.val === 'null' ? null : positiondata.projekt_id.val;
			positiondata.benoetigt_am.val = positiondata.benoetigt_am.val === '' || positiondata.benoetigt_am.val === null ? null : BudgetantraegeLib.formatDateDb(positiondata.benoetigt_am.val);

			var position = {
				"budgetposten": positiondata.budgetposten.val,
				"projekt_id": positiondata.projekt_id.val,
				"konto_id": positiondata.konto_id.val,
				"betrag": positiondata.betrag.val,
				"benoetigt_am": positiondata.benoetigt_am.val,
				"kommentar": positiondata.kommentar.val,
				"erloese": positiondata.erloese.val,
				"investition": positiondata.investition.val,
				"nutzungsdauer": positiondata.nutzungsdauer.val
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
			BudgetantraegeView.setMessage(budgetantragid, "text-danger", messages.join(" "));
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
					BudgetantraegeView.setMessage(budgetantragid, "text-danger", "Positionen mit gleichem Namen vorhanden!");
					$("#position_"+position_id+" .panel-heading .accordion-toggle").addClass("text-danger");
					budgetpostenel.closest(".form-group").addClass("has-error");

					$("#position_"+seen[budgetpostenbez]+" .panel-heading .accordion-toggle").addClass("text-danger");
					$("#form_"+seen[budgetpostenbez]).find("input[name=budgetposten]").closest(".form-group").addClass("has-error");

					return null;
				}
				else
					seen[budgetpostenbez] = position_id;
			}
		}

		return positionen;
	},

	// -----------------------------------------------------------------------------------------------------------------
	// Helper functions

	/**
	 * Checks if a Budgetantrag can be appended, and shows errors if not
	 * @returns {*} - the Budgetbezeichnung if passed, false otherwise
	 */
	checkBudgetantragDataBeforeAdd: function()
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

		if (BudgetantraegeController.global_inputparams.geschaeftsjahr === 'null' || BudgetantraegeController.global_inputparams.geschaeftsjahr === null)
		{
			$("#gjgroup").addClass("has-error");
			passed = false;
		}

		if (BudgetantraegeController.global_inputparams.kostenstelle === 'null' || BudgetantraegeController.global_inputparams.kostenstelle === null)
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
			for (var i = 0; i < BudgetantraegeController.global_budgetantraege.existentBudgetantraege.length; i++){
				if (BudgetantraegeController.global_budgetantraege.existentBudgetantraege[i].bezeichnung === budgetBezeichnung)
				{
					$("#budgetbezgroup").addClass("has-error");
					passed = false;
					break;
				}
			}

			if (passed !== false)
			{
				for (var i = 0; i < BudgetantraegeController.global_budgetantraege.newBudgetantraege.length; i++)
				{
					if (BudgetantraegeController.global_budgetantraege.newBudgetantraege[i].bezeichnung === budgetBezeichnung)
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
	},

	/**
	 * Checks entries for a Budgetposition before it is saved
	 * @param positionFormDom
	 * @returns {*} object inidicating if data has an error (is invalid)
	 * and containing either error messages or the positiondata
	 */
	checkBudgetpositionDataBeforeAdd: function (positionFormDom)
	{
		var valid = true;

		var budgetpostenelem = positionFormDom.find("input[name=budgetposten]");
		var projektidelem = positionFormDom.find("select[name=projekt_id]");
		var kontoidelem = positionFormDom.find("select[name=konto_id]");
		var betragelem = positionFormDom.find("input[name=betrag]");
		var benoetigtamelem = positionFormDom.find("input[name=benoetigtam]");
		var jahrverteilen = positionFormDom.find("input[name=jahrverteilen]");
		var kommentarelem = positionFormDom.find("textarea[name=kommentar]");
		var erloeseElem = positionFormDom.find("input[name=erloese]");
		var investitionElem = positionFormDom.find("input[name=investition]");
		var nutzungsdauerElem = positionFormDom.find("input[name=nutzungsdauer]");

		var positionFields = {};
		var messages = [];

		var jahrverteilt = jahrverteilen.prop("checked");
		var erloese = erloeseElem.prop("checked");
		var investition = investitionElem.prop("checked");

		positionFields.budgetposten = {"elem": budgetpostenelem, "val": budgetpostenelem.val(), "required": true};
		positionFields.projekt_id = {"elem": projektidelem, "val": projektidelem.val(), "required": false};
		positionFields.konto_id = {"elem": kontoidelem, "val": kontoidelem.val(), "required": true};
		positionFields.betrag = {"elem": betragelem, "val": betragelem.val(), "required": true};
		positionFields.benoetigt_am = {"elem": benoetigtamelem, "val": jahrverteilt ? null : benoetigtamelem.val(), "required": !jahrverteilt};
		positionFields.kommentar= {"elem": kommentarelem, "val": kommentarelem.val(), "required": false};
		positionFields.erloese = {"elem": erloeseElem, "val": erloese, "required": false};
		positionFields.investition = {"elem": investitionElem, "val": investition, "required": false};
		positionFields.nutzungsdauer = {"elem": nutzungsdauerElem, "val": !investition ? 4 : nutzungsdauerElem.val(), "required": investition};

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

		if (!jahrverteilt && !BudgetantraegeLib.checkDate(positionFields.benoetigt_am.val))
		{
			valid = false;
			benoetigtamelem.parent().addClass("has-error");
			messages.push("Ungültiges Datum! (Richtiges Format: Tag.Monat.Jahr)");
		}

		// If investition is checked and nutzungsdauer is not a valid number
		if (investition && positionFields.nutzungsdauer.val != parseInt(positionFields.nutzungsdauer.val, 10))
		{
			valid = false;
			nutzungsdauerElem.parent().addClass("has-error");
			messages.push("Ungültiges Nutzungsdauer!");
		}

		if (!BudgetantraegeLib.checkDecimalFormat(positionFields.betrag.val))
		{
			valid = false;
			betragelem.parent().addClass("has-error");
			messages.push("Ungültiges Zahlenformat!");
		}
		else
		{
			var betragstr = positionFields.betrag.val.replace(/\./g, '').replace(',', '.');
			var betragfloat = parseFloat(betragstr);

			if (betragfloat > 99999999.99)
			{
				valid = false;
				betragelem.parent().addClass("has-error");
				messages.push("Teilbudget muss < 10^8 sein!");
			}
			else
			{
				positionFields.betrag.val = betragfloat;
			}
		}

		if (!valid)
		{
			return {"error": 1, "data": messages};
		}

		return {"error": 0, "data": positionFields};
	},

	/**
	 * Checks if user changed a Budgetposition form. Compares initial state with current Budgetposition form state
	 * @param initBudgetposition Budgetposition object containing the initial state
	 * @returns {boolean} wether the Budgetposition form was modified
	 */
	checkIfBudgetpositionFormChanged: function (initBudgetposition)
	{
		return initBudgetposition.initialForm !== $("#form_"+initBudgetposition.id).serialize();
	},

	/**
	 *	Show/hide the button for adding a Budgetatrag.
	 */
	toogleBudgetantraegeAddButtonVisibility: function ()
	{
		$("#addBudgetantragForm").toggleClass("hidden");
	},

	/**
	 * Collapses all Budgetantraege (and Budgetpositionen) panels
	 */
	collapseAllBudgetantraege: function ()
	{
		$(".accordion-toggle").addClass("collapsed");
		$(".panel-collapse").removeClass("in");
	}
};

