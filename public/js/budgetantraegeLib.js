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
	//console.log(sum === null);
	if(sum === null) return parseFloat(0).toFixed(2);
	return sum.toFixed(2).replace(".", ",");
}