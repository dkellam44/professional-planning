Notion Formulas 2.0: Comprehensive Reference
1. Core Concepts
Definition: Notion formulas are code snippets within Formula properties in databases that process data from other properties using operators and functions to output new data.
Purpose: Enable calculations, data manipulation, status automation, and dynamic information display otherwise impossible in Notion databases.
2. Formula Basics
Creating a Formula Property:
In a database, open the View Options menu → Properties.
Click "New Property".
Name the property.
Set the Type to "Formula".
The Formula Editor: Accessed by clicking into a formula property cell.
Editor Field: Write formulas here. Supports:
New lines: Shift + Enter or Cmd/Ctrl + Enter
Indentation: Tab
Comments: /* comment */
Live Preview: Shows the current formula result or lists errors.
Component List: Scrollable list of properties, built-ins, functions, and variables. Click to insert. Typing filters the list.
Context Window: Shows description, syntax, and examples for the selected/hovered component.
Saving: Exit editor (Ctrl/Cmd + Enter) to save, even with errors. Errors prevent the property from displaying a result.
Syntax:
Uses parentheses () for function calls: abs(-20).
Supports dot notation for functions: -20.abs().
Uses commas , to separate function arguments: add(34, 8).
Uses double quotes " for strings and property references outside the editor: "Text", prop("Title").
Property Tokens: Inside the editor, prop("Title") appears as a token like Title. Copying/pasting uses the prop() syntax.
Operators perform calculations (+, -, *, /, %, ^).
Supports standard mathematical order of operations (PEMDAS). Use () for explicit order.
Functions can be nested; inner functions execute first.
CRITICAL: Does NOT support arrow function syntax (=>). In map/filter, use current.prop() directly, NOT current => current.prop().
3. Data Types
Notion formulas handle seven data types. A formula can only output a single type. Automatic type conversion is limited (mainly for string concatenation and some regex functions); manual conversion is often needed.
String: Text content. Created with " ". Supports concatenation (+ or join()). Cannot perform math unless converted (toNumber()). Comparisons (==, !=) are case-sensitive and type-strict ("1" == 1 is false). Special characters need escaping (\", \\, \n, \t).
Number: Numeric values for math operations. Follows PEMDAS. Large numbers (>21 digits) display in scientific notation but retain full value in editor. Auto-converts to string when combined with other types using +.
Boolean (Checkbox): true (checked) or false (unchecked). Represents truth states. Often result from comparisons (>, ==). Falsy values: false, 0, "", []. All other values are truthy (true, "0", "false", non-empty strings, dates, non-empty lists).
Date: Date objects, potentially with time and timezone. Can be manipulated with date functions (dateAdd, dateBetween, etc.). Properties outputting Date: Date, Created time, Edited time, relevant Rollups/Formulas. Functions outputting Date: start, end, now, today, fromTimestamp, dateAdd, dateSubtract, dateRange, parseDate. Timezones are handled based on system settings; now() and fromTimestamp() always display in local time. formatDate() outputs a string, not a date object.
List (Array): Ordered collection of items ([]). Can contain mixed data types, though non-strings convert to strings in preview. Retain original types internally. Accessed via index (at()). Supports various list-specific functions.
Person: Represents a Notion user. Sourced from Person, Created by, Last edited by properties. Use name() and email() to access details. For Person properties (multi-user potential), use .first() or .map(current...).
Page: Represents a Notion page. Sourced from Relation, Rollup, Formula properties. Can access the page's own properties (prop("Relation").first().prop("Created By")) and built-ins (prop("Created By"), prop("Created Time"), prop("Last Edited By"), prop("Last Edited Time"), id()).
4. Property References & Data Types
Property TypeFormula Data TypeNotes
TitleStringDefault "Name" property.
TextString
NumberNumber
SelectString
Multi-SelectListReturns a list of strings. (Previously: comma-separated string). Use list functions to manipulate.
StatusStringReturns the status name as text.
DateDateUse dateStart(), dateEnd() for ranges.
PersonListList of Person objects. Use .first() or .map().
Files & MediaListList of string URLs.
CheckboxBooleantrue or false.
URLString
EmailString
PhoneString
FormulaAnyDepends on the formula's output.
RelationListList of Page objects. Use .map() or .first() to access related page properties.
RollupVariesDepends on source property & calculation. 'Show Original' often outputs string. Others (Sum, Avg, etc.) output Number/Date.
Create timeDate
Created byPersonSingle Person object.
Last edited timeDate
Last edited byPersonSingle Person object.
5. Operators & Built-ins
Mathematical Operators:
+ / add(): Addition (Numbers), Concatenation (Strings). Auto-converts mixed types to strings.
- / subtract(): Subtraction.
* / multiply(): Multiplication.
/ / divide(): Division.
% / mod(): Remainder (not true modulo). Takes sign of the dividend.
^ / pow(): Exponentiation (right-to-left associativity).
Logical Operators: (Case-insensitive, supports symbol alternatives)
and / && / and(): True if both operands are true.
or / || / or(): True if at least one operand is true.
not / ! / not(): Inverts Boolean value.
Comparison Operators: (Cannot be chained; use and. Type-strict unless noted)
== / equal(): Equal to.
!= / unequal(): Not equal to.
> / larger(): Greater than (Numbers, Strings, Booleans, Dates). Dates: "later".
>= / largerEq(): Greater than or equal to. Dates: "later or same".
< / smaller(): Less than. Dates: "earlier".
<= / smallerEq(): Less than or equal to. Dates: "earlier or same".
Conditional (Ternary) Operator:
condition ? valueIfTrue : valueIfFalse: Shorthand for if().
Constants:
true: Boolean true (checked checkbox).
false: Boolean false (unchecked checkbox).
e(): Euler's number (approx. 2.718).
pi(): Pi (approx. 3.141).
Built-in Variables (for List functions like map, filter):
current: Represents the list item currently being processed.
index: Represents the zero-based index of the current item.
IMPORTANT: Do NOT use arrow function syntax (=>) with current. Use current.prop() directly, not current => current.prop().
6. Functions (Categorized)
(Syntax includes function and dot notation where applicable)
Logical & Conditional:
if(condition, valueIfTrue, valueIfFalse): Basic conditional logic. Use ? : for shorthand.
ifs(condition1, value1, condition2, value2, ..., elseValue): Simpler multiple else if conditions. Avoids deep nesting. Can omit final elseValue to return empty if no condition met.
empty(value) / value.empty(): Returns true if value is falsy ("", 0, false, []) or truly empty. Checks falsiness, not just emptiness.
Text Manipulation:
concat(list1, list2, ...) / list.concat(list2, ...): Combines lists into one list. (Note: Differs from Formulas 1.0 concat). Use + for string concatenation.
join(list, separator) / list.join(separator): Joins list items into a string using the specified separator string. Required separator.
length(string) / string.length() / length(list) / list.length(): Returns the number of characters in a string or items in a list.
lower(string) / string.lower(): Converts string to lowercase.
upper(string) / string.upper(): Converts string to uppercase.
replace(string, pattern, replacement) / string.replace(pattern, replacement): Replaces the first occurrence of pattern (can be regex) with replacement.
replaceAll(string, pattern, replacement) / string.replaceAll(pattern, replacement): Replaces all occurrences of pattern (can be regex) with replacement.
slice(string, startIdx, endIdx[opt]) / string.slice(startIdx, endIdx[opt]): Extracts a substring. endIdx is exclusive. (Note: Replaces Formulas 1.0 slice; use substring for old behavior).
substring(string, startIdx, endIdx[opt]) / string.substring(startIdx, endIdx[opt]): Extracts a substring. endIdx is exclusive. (Equivalent to Formulas 1.0 slice).
split(string, separator[opt]) / string.split(separator[opt]): Splits a string into a list based on separator. Defaults to space if no separator.
repeat(string, count) / string.repeat(count): Repeats a string count times. Auto-converts non-string first arg.
padStart(string, targetLength, paddingString) / string.padStart(targetLength, paddingString): Adds paddingString to the start until targetLength is reached.
padEnd(string, targetLength, paddingString) / string.padEnd(targetLength, paddingString): Adds paddingString to the end until targetLength is reached.
link(labelString, urlString) / labelString.link(urlString): Creates a clickable link with labelString text pointing to urlString. Supports mailto: and tel:. Example: link("Notion Website", "https://www.notion.so")
style(string, styles...) / string.style(styles...): Adds formatting ( "b", "i", "u", "s", "c") and colors ("red", "blue_background", etc.) to a string. Example: style("Styled Text", "b", "i", "blue")
unstyle(string, stylesToRemove[opt]) / string.unstyle(stylesToRemove[opt]): Removes specified styles, or all styles if none specified. Example: unstyle("Formatted Text")
contains(string, substring) / string.contains(substring): Returns true if string contains substring. Case-sensitive. Limited vs test(). Auto-converts args to string.
test(string, pattern) / string.test(pattern): Returns true if string contains pattern (can be regex). More powerful than contains(). Auto-converts Number/Boolean args.
match(string, pattern) / string.match(pattern): Returns a list of all matches of pattern (regex) found in string.
Mathematical:
abs(number) / number.abs(): Absolute value.
ceil(number) / number.ceil(): Rounds up to the nearest integer (towards positive infinity).
floor(number) / number.floor(): Rounds down to the nearest integer (towards negative infinity).
round(number) / number.round(): Rounds to the nearest integer (0.5 rounds towards positive infinity, e.g. -4.5 rounds to -4).
sqrt(number) / number.sqrt(): Square root.
cbrt(number) / number.cbrt(): Cube root.
exp(number) / number.exp(): Euler's number e raised to the power of number (e^number).
ln(number) / number.ln(): Natural logarithm (base e).
log10(number) / number.log10(): Base-10 logarithm.
log2(number) / number.log2(): Base-2 logarithm.
sign(number) / number.sign(): Returns -1 (negative), 1 (positive), or 0 (zero).
min(num1, num2, ...) / [numList].min(num2, ...): Smallest number among arguments/lists.
max(num1, num2, ...) / [numList].max(num2, ...): Largest number among arguments/lists.
sum(num1, num2, ...) / [numList].sum(num2, ...): Sum of arguments/lists.
mean(num1, num2, ...) / [numList].mean(num2, ...): Average (arithmetic mean) of arguments/lists.
median(num1, num2, ...) / [numList].median(num2, ...): Median value of arguments/lists.
Date & Time:
now(): Current date and time (local timezone).
today(): Current date (no time, local timezone).
minute(date) / date.minute(): Minute of the date (0-59).
hour(date) / date.hour(): Hour of the date (0-23).
day(date) / date.day(): Day of the week (0=Sun, 6=Sat).
date(date) / date.date(): Day of the month (1-31).
week(date) / date.week(): ISO week number of the year (1-53).
month(date) / date.month(): Month of the year (0=Jan, 11=Dec).
year(date) / date.year(): Year of the date.
dateAdd(date, number, unit) / date.dateAdd(number, unit): Adds number of units (e.g., "days", "months") to date.
dateSubtract(date, number, unit) / date.dateSubtract(number, unit): Subtracts number of units from date.
dateBetween(date1, date2, unit) / date1.dateBetween(date2, unit): Returns the number of units between date1 and date2. Positive if date1 > date2.
dateRange(startDate, endDate) / startDate.dateRange(endDate): Creates a date range object.
dateStart(date) / date.dateStart(): Returns the start date from a date object (or the date itself if not a range). Formerly start().
dateEnd(date) / date.dateEnd(): Returns the end date from a date range (or the date itself if not a range). Formerly end().
formatDate(date, formatString, timezone[opt]) / date.formatDate(formatString, timezone[opt]): Formats date into a string using Luxon/Moment tokens (e.g., "YYYY-MM-DD"). Outputs a string.
parseDate(string) / string.parseDate(): Converts an ISO 8601 formatted string (e.g., "2023-10-27", "2023-10-27T10:00:00Z") into a date object.
timestamp(date) / date.timestamp(): Converts date to Unix millisecond timestamp (Number).
fromTimestamp(number) / number.fromTimestamp(): Converts Unix millisecond timestamp (Number) to date object.
List Manipulation:
at(list, index) / list.at(index): Returns item at zero-based index.
first(list) / list.first(): Returns the first item.
last(list) / list.last(): Returns the last item.
slice(list, startIdx, endIdx[opt]) / list.slice(startIdx, endIdx[opt]): Extracts a sub-list. endIdx is exclusive.
sort(list, comparator[opt]) / list.sort(comparator[opt]): Sorts list. Default sort order depends on data type. Optional comparator expression (e.g., current.prop("Date")).
reverse(list) / list.reverse(): Reverses the order of items in a list.
unique(list) / list.unique(): Returns a list with duplicate values removed.
includes(list, value) / list.includes(value): Returns true if list contains value. Exact match required.
find(list, condition) / list.find(condition): Returns the first item matching the condition expression.
findIndex(list, condition) / list.findIndex(condition): Returns the zero-based index of the first item matching the condition.
filter(list, condition) / list.filter(condition): Returns a new list containing only items matching the condition. Use current directly in condition, e.g., list.filter(current.prop("Status") == "Done") NOT list.filter(current => current.prop("Status") == "Done").
some(list, condition) / list.some(condition): Returns true if at least one item matches the condition.
every(list, condition) / list.every(condition): Returns true if all items match the condition.
map(list, expression) / list.map(expression): Returns a new list where each item is the result of applying the expression to the original item. Use current directly in expression, e.g., list.map(current.prop("Amount")) NOT list.map(current => current.prop("Amount")). Use current and index variables.
flat(list) / list.flat(): Flattens a list of lists by one level.
Type Conversion & Utility:
format(value) / value.format(): Converts any data type to its string representation.
toNumber(value) / value.toNumber(): Converts String, Boolean (true=1, false=0), or Date (to timestamp) into a Number. Strings only convert if they start with digits.
id() / page.id() / person.id(): Returns the unique ID (string) of the current page, a specified Page object, or a specified Person object.
name(person) / person.name(): Returns the full name string of a Person object. Example: name(prop("Created By")) /* Output: "Jane Doe" */
email(person) / person.email(): Returns the email string of a Person object.
let(varName, value, expression) / value.let(varName, expression): Assigns value to varName for use within expression. Scope is limited to the let() call.
lets(var1, val1, var2, val2, ..., expression) / val1.lets(var1, var2, val2, ..., expression): Defines multiple variables for use in expression. Useful for complex logic and accessing outer current in nested list functions.
7. Integration with Databases
Referencing Properties: Use prop("Property Name") or the token equivalent in the editor to access data from other columns in the same row.
Formulas in Filters:
Filter options depend on the formula's output data type (String, Number, Date, Boolean, etc.).
Formulas are read-only. Filters cannot change a formula's output.
For new rows to appear correctly in a filtered view, the filter criteria must match the formula's default output for a new (potentially empty) row.
Initialization Quirk: Formulas (especially those referencing Created/Edited Time/By) might appear 'empty' for a split second upon row creation. Filters might need an or [Formula Property] is empty condition to catch new rows correctly.
Grouping by Formulas:
Database views can be grouped by a formula property.
Grouping options depend on the formula's output data type:
String: Group by Exact Name or Alphabetical.
Number: Group by Number Ranges (set interval/range).
Date: Group by Relative, Day, Week, Month, Year.
Boolean: Group by Checked vs. Unchecked.
List/Person/Page: Grouped by their string representation (often alphabetical).
8. Advanced Topics & Reference
Operator Precedence & Associativity: Determines the order of operations. Parentheses () have highest precedence. Exponentiation ^ is right-to-left. Most others are left-to-right. Comparison operators (>, ==, etc.) cannot be chained.
Precedence (High to Low): (), not, ^, * / %, + -, > >= < <=, == !=, and, or, ? :
Data Type Conversion Summary:
To String: format(), formatDate(), + operator (concatenation). Regex functions test/replace/replaceAll auto-convert Numbers/Booleans.
To Number: toNumber(), timestamp(), date part functions (minute, year, etc.).
To Date: fromTimestamp(), parseDate().
To Boolean: Use comparison (==, >), logical (and, or), or if()/ifs() statements to derive a Boolean based on other types. empty() checks falsiness.
Fixing Errors: Check error messages in the editor preview. Common issues: Mismatched parentheses/quotes, incorrect argument types/counts, referencing undefined variables (let/lets), invalid characters, calling functions on wrong data types, circular dependencies, using arrow function syntax (=> is NOT supported - use current.prop() directly).
Property Reference Limits: A formula's calculation chain can only reference up to 15 other properties indirectly (e.g., Formula A references Formula B which references Formula C...). Exceeding this limit silently truncates the calculation.
Regular Expressions (Regex): Used in test(), match(), replace(), replaceAll(). Allows complex pattern matching. Key concepts supported:
Literals: a, 1
Character Classes: \d (digit), \w (word char), \s (space), . (any char), [] (specific chars, e.g., [abc]), [^] (negated class, e.g., [^abc]). Use [Jj] for case-insensitivity.
Quantifiers: * (0+), + (1+), ? (0 or 1), {n}, {n,}, {n,m}. Add ? for lazy matching (e.g., *?).
Anchors: ^ (start of string), $ (end of string), \b (word boundary), \B (not word boundary).
Grouping & Capturing: () (capture group), (?:) (non-capturing), (?<name>) (named group).
Alternation: | (OR).
Substitutions (in replace/replaceAll): $n (capture group n), $& (whole match), $` (text before match), $' (text after match).
Backreferences: \n (match text of group n), \k<name>.
Escaping: Use \ before special chars (., *, ?, (, ), [, ], \, etc.). Use \\ for a literal backslash. Use Unicode \uXXXX or octal/hex codes within regex pattern. Escape " with \" in strings, use Unicode \u0022 etc. in regex patterns.
Unsupported: Lookarounds, flags/modifiers (like /i for case-insensitivity).
Returning Null/Empty Values:
String: ""
Number: toNumber("")
Date: parseDate("") (formerly fromTimestamp(toNumber("")))
List: []
Boolean: No true empty state. Use format() and return "" for the empty case if needed as a string.
9. Key Use Case Examples (Illustrative)
Counting Multi-Select/Relation Items: length(replaceAll(prop("MultiSelect"), "[^,]", "")) + 1 (Classic method for comma-separated strings). For true lists (Formulas 2.0 relations/multi-select): prop("Relation").length() or prop("MultiSelect").length().
Progress Bars: Use slice() or substring() with repeated characters (●, ○) based on a percentage property. slice("●●●●●", 0, prop("Percent") * 5) + slice("○○○○○", 0, (1 - prop("Percent")) * 5) + " " + format(prop("Percent") * 100) + "%"
Conditional Formatting/Status: Use if() or ifs() based on dates, numbers, or text content. if(prop("Due Date") < now(), "🔴 Overdue", "🟢 On Track"), prop("Value").style(prop("Value") > 1000 ? "b" : "default")
Calculating Durations/Deadlines: dateBetween(prop("End Date"), prop("Start Date"), "days"), dateAdd(prop("Start Date"), prop("Lead Time"), "days").
Dynamic Naming/IDs: Concatenate properties: prop("Project Code") + " - " + prop("Task Name").
Extracting Information: Use replace()/replaceAll() with regex to get parts of strings (e.g., file extensions, specific words). replace(prop("File URL"), ".*\\.(\\w+)$", "$1").
Complex Date Logic: Combine dateAdd, dateSubtract, day, month, year, if/ifs for recurring dates or relative date calculations (e.g., finding the next birthday, first/last day of month).
Aggregating Related Data (with map): prop("Related Expenses").map(current.prop("Amount")).sum(), prop("Tasks").filter(current.prop("Status") == "Done").length() / prop("Tasks").length() for completion percentage.