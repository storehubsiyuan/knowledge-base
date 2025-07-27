const express = require("express");
const database = require("./database");
const employeeService = require("./services/employeeService");

const app = express();
app.use(express.json());

// Initialize database connection
database.connect().catch(console.error);

// VULNERABLE ENDPOINTS

// Endpoint 1: Direct query parameter injection
app.get("/employees", async (req, res) => {
  try {
    // User can inject operators via query params
    // Example: /employees?employeeNumber[$gt]=100&managerAccess[$ne]=false
    const employees = await employeeService.findEmployees(req.query);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Employee number filter injection
app.get("/employees/number/:number", async (req, res) => {
  try {
    // User can inject: /employees/number/{"$gt":100}
    const numberFilter = JSON.parse(req.params.number);
    const employees = await employeeService.findEmployeesByNumber(numberFilter);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 3: Employer search with regex injection
app.post("/employees/employer", async (req, res) => {
  try {
    // User can inject regex operators in employerName field
    const { employerName } = req.body;
    const employees = await employeeService.findEmployeesByEmployer(
      employerName
    );
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 4: Complex search with multiple injection points
app.post("/employees/search", async (req, res) => {
  try {
    // Multiple injection points in search criteria
    const employees = await employeeService.searchEmployees(req.body);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 5: Update with operator injection
app.put("/employees/:number", async (req, res) => {
  try {
    // User can inject update operators
    const updated = await employeeService.updateEmployee(
      req.params.number,
      req.body
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 6: Aggregation with pipeline injection
app.post("/employees/stats", async (req, res) => {
  try {
    const { groupBy, filters } = req.body;
    const stats = await employeeService.getEmployeeStats(groupBy, filters);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 7: Extremely dangerous $where injection
app.post("/employees/custom", async (req, res) => {
  try {
    const { whereClause } = req.body;
    const employees = await employeeService.findEmployeesCustom(whereClause);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 8: Advanced search with multiple injection vectors
app.post("/employees/advanced", async (req, res) => {
  try {
    const employees = await employeeService.advancedSearch(req.body);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 9: Bulk delete with injection
app.delete("/employees", async (req, res) => {
  try {
    const result = await employeeService.deleteEmployees(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 10: Raw database query injection
app.post("/query/:collection", async (req, res) => {
  try {
    const result = await database.executeRawQuery(
      req.params.collection,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vulnerable server running on port ${PORT}`);
});
