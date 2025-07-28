const Employee = require("../../../models/Employee");

class EmployeeService {
  // VULNERABLE: Direct query object injection
  async findEmployees(queryParams) {
    // User input passed directly to MongoDB query - allows operator injection
    return await Employee.find(queryParams);
  }

  // VULNERABLE: Employee number comparison with user input
  async findEmployeesByNumber(numberQuery) {
    // Allows injection like: { $gt: 0 } or { $ne: null }
    return await Employee.find({ employeeNumber: numberQuery });
  }

  // VULNERABLE: Employer name filter with regex injection
  async findEmployeesByEmployer(employerName) {
    // User can inject regex operators: { $regex: ".*", $options: "i" }
    return await Employee.find({ employerName: employerName });
  }

  // VULNERABLE: Complex query with user-controlled operators
  async searchEmployees(searchCriteria) {
    // Directly passing user input allows injection of operators like $where, $expr
    const query = {
      $or: [
        { firstName: searchCriteria.name },
        { lastName: searchCriteria.name },
        { email: searchCriteria.email },
      ],
      ...searchCriteria.filters, // User can inject operators here
    };

    return await Employee.find(query);
  }

  // VULNERABLE: Update operation with operator injection
  async updateEmployee(employeeNumber, updateData) {
    // User can inject update operators like $unset, $inc, $push
    return await Employee.findOneAndUpdate(
      { employeeNumber: employeeNumber },
      updateData, // Direct user input - vulnerable to operator injection
      { new: true }
    );
  }

  // VULNERABLE: Aggregation pipeline injection
  async getEmployeeStats(groupBy, filters) {
    // User controls pipeline stages - can inject malicious stages
    const pipeline = [
      { $match: filters }, // User-controlled filters
      { $group: groupBy }, // User-controlled grouping
      { $sort: { count: -1 } },
    ];

    return await Employee.aggregate(pipeline);
  }

  // VULNERABLE: $where operator allowing JavaScript injection
  async findEmployeesCustom(whereClause) {
    // Extremely dangerous - allows arbitrary JavaScript execution
    return await Employee.find({
      $where: whereClause, // User input directly in $where
    });
  }

  // VULNERABLE: Combination of multiple injection points
  async advancedSearch(criteria) {
    const query = {};

    // Multiple injection points
    if (criteria.employeeNumber) {
      query.employeeNumber = criteria.employeeNumber; // Can inject operators
    }

    if (criteria.employerName) {
      query.employerName = criteria.employerName; // Can inject regex
    }

    if (criteria.assignedStores) {
      query.assignedStores = { $in: criteria.assignedStores }; // Array injection
    }

    // User can override entire query structure
    Object.assign(query, criteria.additionalFilters);

    return await Employee.find(query);
  }

  // VULNERABLE: Delete operation with injection
  async deleteEmployees(deleteQuery) {
    // User can inject operators to delete unintended documents
    return await Employee.deleteMany(deleteQuery);
  }

  // VULNERABLE: Count with injection
  async countEmployees(countQuery) {
    // User can inject operators in count queries
    return await Employee.countDocuments(countQuery);
  }

  // VULNERABLE: findOneAndUpdate with operator injection in filter
  async promoteEmployee(filterCriteria, promotionData) {
    // Both filter and update data are vulnerable
    return await Employee.findOneAndUpdate(
      filterCriteria, // Can inject query operators
      promotionData, // Can inject update operators
      { new: true }
    );
  }

  // VULNERABLE: Exists check with injection
  async checkEmployeeExists(existsQuery) {
    // User can manipulate existence checks
    return await Employee.exists(existsQuery);
  }
}

module.exports = new EmployeeService();
