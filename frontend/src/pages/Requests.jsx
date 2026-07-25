{requests.map((r) => (
          <div key={r._id} className="bg-white border border-ink/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium font-mono">{r.bloodGroup} · {r.unitsNeeded} unit{r.unitsNeeded > 1 ? 's' : ''}</p>
              <p className="text-xs text-muted mt-1">{new Date(r.createdAt).toLocaleString()}</p>
              {r.status === 'matched' && r.respondedDonor && (
                <p className="text-xs text-teal font-medium mt-1">
                  Donor: {r.respondedDonor.name} · {r.respondedDonor.phone}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${URGENCY_STYLES[r.urgency]}`}>{r.urgency}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</span>
            </div>
          </div>
        ))}