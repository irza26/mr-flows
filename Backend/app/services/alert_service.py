def get_active_rules(cur, module):
    cur.execute("""
        SELECT id, rule_name, parameter, operator, threshold
        FROM alert_rules
        WHERE module = %s AND status = 'active'
        ORDER BY threshold ASC
    """, (module,))
    return cur.fetchall()
