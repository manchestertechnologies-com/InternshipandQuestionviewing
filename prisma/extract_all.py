import docx
import json
import os

def parse_docx(filename, group_name, mentor_name, mentor_email):
    if not os.path.exists(filename):
        print(f"Error: {filename} not found.")
        return []
    
    doc = docx.Document(filename)
    table = doc.tables[0]
    
    # Read headers
    headers = [cell.text.strip().replace('\n', ' ') for cell in table.rows[0].cells]
    
    records = []
    for r_idx in range(1, len(table.rows)):
        row_cells = [cell.text.strip() for cell in table.rows[r_idx].cells]
        if not any(row_cells): # empty row
            continue
            
        record = {
            "group": group_name,
            "mentor_name": mentor_name,
            "mentor_email": mentor_email
        }
        
        for h, val in zip(headers, row_cells):
            record[h] = val
            
        records.append(record)
        
    return records

all_records = []
all_records.extend(parse_docx("PALLAVI_DS_updated.docx", "Group 1", "Pallavi", "pallavids359@gmail.com"))
all_records.extend(parse_docx("PRATEEKSHA_updated.docx", "Group 2", "Prateeksha", "dgprateeksha01@gmail.com"))
all_records.extend(parse_docx("RAMYA_S_updated.docx", "Group 3", "Ramya", "r23616901@gmail.com"))

with open("prisma/interns_data.json", "w", encoding="utf-8") as f:
    json.dump(all_records, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(all_records)} total records from the three Word documents.")
