/**
 * javascript file for additonal, frequently used functions for Managing Budgetantraege, which do not necessarily concern Budget Management.
 */

var BudgetantraegeLib = {
	/**
	 * Finds an element in an array by comparing its id with the given id
	 * @param array
	 * @param id
	 * @returns {*} the element when it was found, false otherwise
	 */
	findInArray: function (array, id)
	{
		for(var i = 0; i < array.length; i++)
		{
			var element = array[i];
			if(element.id === id)
				return element;
		}
		return false;
	},

	/**
	 * Checks if a value is in valid decimal format
	 * Valid format is numbers, optionally with dots (thousand separators), followed by coma, followed by two numbers
	 * @param value
	 */
	checkDecimalFormat: function(value)
	{
		//var betragregex = /^[0-9]{1,3}([\.]?[0-9]{3})*([,][0-9]{1,2})?$/;
		var betragregex = /^([.0-9])+([,][0-9]{1,2})?$/;
		return value.match(betragregex);
	},

	/**
	 * Formats a numeric value as a float with two decimals
	 * @param sum
	 * @returns {string}
	 */
	formatDecimalGerman: function(sum)
	{
		var dec = null;

		if(sum === null)
			dec = parseFloat(0).toFixed(2).replace(".", ",");
		else if(sum === '')
		{
			dec = ''
		}
		else
		{
			dec = parseFloat(sum).toFixed(2);

			dec = dec.split('.');
			var dec1 = dec[0];
			var dec2 = ',' + dec[1];
			var rgx = /(\d+)(\d{3})/;
			while (rgx.test(dec1)) {
				dec1 = dec1.replace(rgx, '$1' + '.' + '$2');
			}
			dec = dec1 + dec2;
		}
		return dec;
	},

	/**
	 * Formats a date in format YYYY-mm-dd to dd.mm.YYYY
	 * @param date
	 * @returns {string}
	 */
	formatDateGerman: function(date)
	{
		return date.substring(8, 10) + "." + date.substring(5, 7) + "." + date.substring(0, 4);
	}
};
