import React from "react";

const CourseTableOnFacultySide = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4 text-white">
        📋 Student Forms
      </h2>

      <table className="w-full border">
        <thead className="bg-gray-200 dark:bg-gray-700">
          <tr>
            <th>Name</th>
            <th>Roll</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((s, i) => (
            <tr key={i}>
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.roll}</td>
              <td className="p-2">{s.status}</td>
              <td className="p-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseTableOnFacultySide;
