# Coda Formula Language Reference for LLMs

> A comprehensive guide for AI assistants working with Coda formulas. Covers syntax, patterns, common errors, and best practices.

---

## 🔤 Basic Syntax Rules

### **Column References**
```coda
[Column Name]           # Reference column in current table
Table.[Column Name]     # Reference column in specific table
[Table].[Column Name]   # Alternative syntax with brackets
thisRow                 # Reference to current row
```

### **Data Types**
- **Text**: `"Hello World"` or `'Hello World'`
- **Numbers**: `42`, `3.14`, `0`
- **Booleans**: `true`, `false`
- **Dates**: `Today()`, `Date(2024, 9, 7)`
- **Currency**: `$100.00` (automatic formatting)
- **Lists**: `List("Item1", "Item2", "Item3")`

---

## 📊 Table Operations & Filtering

### **Basic Table Operations**
```coda
# Filter table rows
Table.Filter(condition)
Table.Filter([Column] = "Value")
Table.Filter([Column] > 100)

# Multiple conditions
Table.Filter([Column1] = "Value" AND [Column2] > 50)
Table.Filter([Status] = "Active" OR [Priority] = "High")

# Sort table
Table.Sort([Column])
Table.Sort([Column], false)  # Descending
```

### **Aggregation Functions**
```coda
# CORRECT: Chain operations properly
Table.Filter(condition).[Column].Sum()
Table.Filter(condition).[Column].Max()
Table.Filter(condition).[Column].Average()
Table.Filter(condition).Count()

# ALTERNATIVE: Function wrapper syntax
Sum(Table.Filter(condition).[Column])
Max(Table.Filter(condition).[Column])
Average(Table.Filter(condition).[Column])
Count(Table.Filter(condition))
```

### **⚠️ Common Aggregation Errors**
```coda
# ❌ WRONG - Will cause "Wrong argument type" error
Table.Filter(condition).Sum([Column])

# ✅ CORRECT - Chain the column selection first
Table.Filter(condition).[Column].Sum()
```

---

## 🔗 Relationships & Lookups

### **Cross-Table References**
```coda
# Reference related table data
[Related Table Row].[Column Name]
[Project].[Status]
[Venture].[Primary Outcome]

# Multiple level lookups
[Project].[Venture].[Primary Outcome]
```

### **Inheritance Patterns**
```coda
# Tasks inherit from Projects
[Project].[Project Focus]    # Task gets Project's focus
[Project].[Outcome]          # Task gets Project's outcome

# Projects inherit from Ventures  
[Venture].[Primary Outcome]  # Project gets Venture's outcome
```

### **Conditional References**
```coda
# Use IfBlank for fallback values
[Override Column].IfBlank([Default Column])
[Custom Outcome].IfBlank([Project].[Outcome])

# Handle missing relationships
If([Related Record], [Related Record].[Column], "Default Value")
```

---

## 🧮 Mathematical & Logical Operations

### **Arithmetic**
```coda
[Column1] + [Column2]
[Revenue] - [Expenses]
[Quantity] * [Price]
[Total] / [Count]
[Base] ^ [Exponent]
```

### **Comparison Operators**
```coda
=          # Equal
!=         # Not equal  
>          # Greater than
>=         # Greater than or equal
<          # Less than
<=         # Less than or equal
```

### **Logical Functions**
```coda
If(condition, true_value, false_value)
And(condition1, condition2, ...)
Or(condition1, condition2, ...)
Not(condition)

# Complex conditionals
If([Status] = "Active", 
   If([Priority] = "High", "Urgent", "Normal"), 
   "Inactive")
```

---

## 📅 Date & Time Functions

### **Common Date Operations**
```coda
Today()                    # Current date
Now()                     # Current date and time
Date(2024, 9, 7)         # Specific date
[Date Column] + Days(30)  # Add 30 days
[End Date] - [Start Date] # Duration between dates
```

### **Date Formatting**
```coda
[Date].ToText("MM/DD/YYYY")
[Date].Year()
[Date].Month()
[Date].Day()
ToWeek([Date])           # Week number
```

---

## 🏗️ Common Formula Patterns

### **Sprint/Timeboxing Calculations**
```coda
# Sum hours by category in current sprint
Tasks.Filter([Sprint] = thisRow AND [Category] = "Billable").[Hours].Sum()

# Calculate percentages
If([Total Hours] = 0, 0, [Billable Hours] / [Total Hours])

# Capacity planning
[Planned Hours] / [Available Hours] * 100
```

### **Financial Calculations**
```coda
# Runway calculation
If([Monthly Burn] > 0, [Cash] / [Monthly Burn] * 4.33, 0)

# Margin calculation  
[Revenue] - [Expenses]
([Revenue] - [Expenses]) / [Revenue] * 100  # Margin %
```

### **Status & Health Indicators**
```coda
# Traffic light status
If([Days Remaining] < 7, "🔴", 
   If([Days Remaining] < 14, "🟡", "🟢"))

# Percentage-based health
If([Completion] >= 0.9, "Excellent",
   If([Completion] >= 0.7, "Good",
      If([Completion] >= 0.5, "Fair", "Poor")))
```

---

## ⚠️ Common Error Patterns & Fixes

### **"Wrong argument type" Errors**
```coda
# ❌ WRONG
Table.Filter(condition).Sum([Column])
# Error: Sum expects numbers, got table

# ✅ CORRECT  
Table.Filter(condition).[Column].Sum()
# Chain column selection before aggregation
```

### **"Cannot find column" Errors**
```coda
# ❌ WRONG - Missing brackets for spaces
Project.Project Focus

# ✅ CORRECT - Use brackets for column names with spaces
[Project].[Project Focus]
```

### **Circular Reference Errors**
```coda
# ❌ WRONG - Self-referencing
[Column].Filter([Column] = thisRow)

# ✅ CORRECT - Reference other table
Other Table.Filter([Reference] = thisRow)
```

### **Empty/Null Handling**
```coda
# ❌ RISKY - May fail if null
[Column] / [Other Column]

# ✅ SAFE - Handle nulls/zeros
If([Other Column] = 0, 0, [Column] / [Other Column])
If(IsBlank([Column]), "N/A", [Column])
```

---

## 🎯 Formula Design Best Practices

### **Performance Optimization**
1. **Filter first**: `Table.Filter().Operation()` not `Table.Operation().Filter()`
2. **Avoid deep nesting**: Break complex formulas into multiple columns
3. **Cache lookups**: Use intermediate columns for repeated calculations

### **Maintainability**
1. **Use descriptive names**: `[Revenue Expected]` not `[Rev Exp]`
2. **Comment complex logic**: Add description in column settings
3. **Consistent patterns**: Use same syntax patterns across similar formulas

### **Error Prevention**
1. **Handle edge cases**: Check for null, zero, empty values
2. **Validate data types**: Ensure operations match expected types
3. **Test incrementally**: Build complex formulas step by step

---

## 📝 Testing & Debugging

### **Formula Testing Approach**
1. **Start simple**: Test basic column references first
2. **Add complexity gradually**: Build filters and calculations step by step  
3. **Use sample data**: Create test rows with known expected results
4. **Check edge cases**: Test with empty, null, and boundary values

### **Common Debugging Techniques**
```coda
# Debug by showing intermediate results
"Debug: " + [Column].ToText()
List([Value1], [Value2], [Value3])  # Show multiple values

# Test filters
Table.Filter(condition).Count()  # How many rows match?
Table.Filter(condition).[ID]     # Which rows match?
```

---

## 🔧 Working Formula Examples (Tested)

### **From FounderOS Project**
```coda
# Task inheritance (WORKING)
[Project].[Project Focus]
[Project].[Outcome]

# Sprint calculations (WORKING)
Tasks.Filter(Sprint = thisRow AND Outcome.[Counts as Billable Hrs] = true).[Estimate Hrs].Sum()
Tasks.Filter(Sprint = thisRow AND Outcome.Outcome = "Learning").[Estimate Hrs].Sum()

# Capacity planning (WORKING)
If([Capacity (hrs)] = 0, 0, [Planned Billable Hrs] / [Capacity (hrs)])

# Financial runway (WORKING)
If([Monthly Burn] > 0, [Cash On Hand] / [Monthly Burn] * 4.33, 0)
```

---

## 🚨 Critical Syntax Reminders

1. **Always use brackets** for column names with spaces: `[Column Name]`
2. **Chain operations properly**: `Table.Filter().[Column].Sum()` not `Table.Filter().Sum([Column])`
3. **Reference tables correctly**: `[Table].[Column]` or `Table.[Column]`
4. **Handle nulls explicitly**: Use `IfBlank()`, `If()`, or null checks
5. **Test formulas incrementally**: Build complex formulas step by step
6. **Use thisRow carefully**: Only in aggregation contexts, not self-references

This reference should help any LLM understand and work effectively with Coda's formula language!