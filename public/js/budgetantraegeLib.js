/**
 * javascript file for additonal, frequently used functions for Managing Budgetantraege, which do not necessarily concern Budget Management.
 */

/**
 * Finds an element in an array by comparing its id with the given id
 * @param array
 * @param id
 * @returns {*} the element when it was found, false otherwise
 */
function findInArray(array, id)
{
	for(var i = 0; i < array.length; i++)
	{
		var element = array[i];
		if(element.id === id)
			return element;
	}
	return false;
}

/**
 * Checks if a value is in valid decimal format
 * Valid format is numbers, optionally followed by dot OR coma, followed by numbers
 * @param value
 */
function checkDecimalFormat(value)
{
	var betragregex = /^[0-9]+([\.,][0-9]{1,2})?$/;
	return value.match(betragregex);
}

/**
 * Formats a numeric value as a float with two decimals
 * @param sum
 * @returns {string}
 */
function formatDecimalGerman(sum)
{
	var dec = null;

	if(sum === null)
		dec = parseFloat(0);
	else
		dec = parseFloat(sum);

	return dec.toFixed(2).replace(".", ",");
}

/**
 * Formats a date in format YYYY-mm-dd to dd.mm.YYYY
 * @param date
 * @returns {string}
 */
function formatDateGerman(date)
{
	return date.substring(8, 10) + "."+date.substring(5, 7) + "." + date.substring(0, 4);
}