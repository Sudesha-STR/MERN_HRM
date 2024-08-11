import boto3
import json
import matplotlib.pyplot as plt
import logging


dynamodb = boto3.resource('dynamodb', region_name='your-region', aws_access_key_id='your-access-key-id', aws_secret_access_key='your-secret-access-key')


table = dynamodb.Table('EmployeeTable')


response = table.scan()
items = response['Items']

highest_hourly_rate_doc = max(items, key=lambda x: x['Hourly Rate'])
smallest_hourly_Rate = min(items, key=lambda x: x['Hourly Rate'])

hourlyrate = [
    {"highest": highest_hourly_rate_doc['Hourly Rate']},
    {"lowest": smallest_hourly_Rate['Hourly Rate']}
]

try:
    with open('E:\\employeesys\\frontend\\public\\hourlyrate.json', 'w') as json_file:
        json.dump(hourlyrate, json_file)
except Exception as e:
    logging.error(f"Error writing to file: {e}")


part_time_count = sum(1 for item in items if item.get("Full or Part-Time") == "P")
full_time_count = sum(1 for item in items if item.get("Full or Part-Time") == "F")


categories = ['Part-Time', 'Full-Time']
values = [part_time_count, full_time_count]

plt.bar(categories, values, color=['blue', 'green'])
plt.title('Number of Documents by Employment Type')
plt.xlabel('Employment Type')
plt.ylabel('Number of Documents')
plt.savefig('E:\\employeesys\\frontend\\public\\graph.png')
print("First graph made")
plt.close()


hourly_rates = [item['Hourly Rate'] for item in items if 'Hourly Rate' in item and 'Typical Hours' in item]
typical_hours = [item['Typical Hours'] for item in items if 'Hourly Rate' in item and 'Typical Hours' in item]


plt.scatter(typical_hours, hourly_rates, color='r', alpha=0.5)
plt.title('Scatter Plot of Hourly Rate vs Typical Hours')
plt.xlabel('Typical Hours')
plt.ylabel('Hourly Rate')
plt.grid(True)
plt.savefig('E:\\employeesys\\frontend\\public\\graph2.png')
plt.close()


salary_count = sum(1 for item in items if item.get("Salary or Hourly") == "Salary")
hourly_count = sum(1 for item in items if item.get("Salary or Hourly") == "Hourly")


categories = ['Salary', 'Hourly']
values = [salary_count, hourly_count]

plt.bar(categories, values, color=['blue', 'green'])
plt.title('Number of Documents by Employment Type')
plt.xlabel('Employment Type')
plt.ylabel('Number of Documents')
plt.savefig('E:\\employeesys\\frontend\\public\\graph3.png')
plt.close()


salaries = [item['Annual Salary'] for item in items if 'Annual Salary' in item]


plt.hist(salaries, bins=10, color='skyblue', edgecolor='black')
plt.title('Histogram of Salaries')
plt.xlabel('Salary Range')
plt.ylabel('Frequency')
plt.savefig('E:\\employeesys\\frontend\\public\\graph4.png')
plt.close()


job_titles = {}
for item in items:
    job_titles[item['Job Titles']] = job_titles.get(item['Job Titles'], 0) + 1

sorted_job_titles = sorted(job_titles.items(), key=lambda x: x[1], reverse=True)[:5]

try:
    with open('E:\\employeesys\\frontend\\public\\jobtitle.json', 'w') as json_file:
        json.dump(sorted_job_titles, json_file)
except Exception as e:
    logging.error(f"Error writing to file: {e}")


departments = {}
for item in items:
    departments[item['Department']] = departments.get(item['Department'], 0) + 1

sorted_departments = sorted(departments.items(), key=lambda x: x[1], reverse=True)[:5]

try:
    with open('E:\\employeesys\\frontend\\public\\department.json', 'w') as json_file:
        json.dump(sorted_departments, json_file)
except Exception as e:
    logging.error(f"Error writing to file: {e}")


plt.boxplot(salaries)
plt.title('Box Plot of Salary Distribution')
plt.ylabel('Salary')
plt.savefig('E:\\employeesys\\frontend\\public\\graph5.png')
plt.close()


average_salaries = {}
for item in items:
    department = item['Department']
    salary = item.get('Annual Salary')
    if salary:
        if department not in average_salaries:
            average_salaries[department] = {'total': 0, 'count': 0}
        average_salaries[department]['total'] += salary
        average_salaries[department]['count'] += 1

average_salaries = {k: v['total'] / v['count'] for k, v in average_salaries.items()}


plt.figure(figsize=(30, 10))
plt.bar(average_salaries.keys(), average_salaries.values(), color='skyblue')
plt.xlabel('Departments')
plt.ylabel('Average Salary')
plt.title('Average Salaries Across Different Departments')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('E:\\employeesys\\frontend\\public\\graph6.png')
plt.close()
