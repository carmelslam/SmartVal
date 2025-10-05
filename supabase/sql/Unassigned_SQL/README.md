# Unassigned SQL Files

**Total Files**: 215  
**Status**: All deployed to Supabase, but unknown which are working/broken/obsolete

## What This Folder Contains

All existing SQL files that haven't been assigned to a phase yet.

As we work through issues:
- Working SQL → moves to appropriate Phase folder
- Obsolete SQL → moves to Obsolete_Archive folder
- This folder shrinks as we organize

## Current Count by Pattern

Run this to see breakdown:
```bash
ls -1 | grep -i "fix" | wc -l     # Files with "FIX" in name
ls -1 | grep -i "diagnostic" | wc -l  # Diagnostic files
ls -1 | grep -i "phase" | wc -l   # Phase files
ls -1 | grep -i "check" | wc -l   # Check/verification files
```

## DO NOT DELETE

All files preserved here until we determine their status through testing.
