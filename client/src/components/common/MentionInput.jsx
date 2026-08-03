import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { AtSign, User } from 'lucide-react';

const MentionInput = forwardRef(({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Viết bình luận...',
  users = [],
  className = '',
  rows = 1,
  disabled = false,
  autoFocus = false,
  maxLength = 2000,
  onKeyDown,
}, ref) => {
  const textareaRef = useRef(null);
  useImperativeHandle(ref, () => textareaRef.current);

  const containerRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trackedMentions, setTrackedMentions] = useState([]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter users based on query
  const filteredUsers = React.useMemo(() => {
    if (!users || users.length === 0) return [];
    if (!query) return users.slice(0, 8);
    const q = query.toLowerCase().trim();
    return users.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [users, query]);

  // Adjust selectedIndex if filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredUsers.length, query]);

  const checkMentionTrigger = (text, cursorPos) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    // Matches @ followed by zero or more non-whitespace/non-special characters
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_.-]*)$/);

    if (match) {
      const matchedText = match[0];
      const mentionText = match[1];
      // Index of '@' symbol
      const atIndex = match.index + (matchedText.startsWith('@') ? 0 : 1);
      setMentionStartIndex(atIndex);
      setQuery(mentionText);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Check which mentions are still in the text
    const updatedMentions = trackedMentions.filter(userId => {
      const userObj = users.find(u => u._id === userId);
      return userObj && newText.includes(`@${userObj.name}`);
    });
    setTrackedMentions(updatedMentions);

    if (onChange) {
      onChange(newText, updatedMentions);
    }

    checkMentionTrigger(newText, cursorPos);
  };

  const handleSelectUser = (selectedUser) => {
    if (!textareaRef.current) return;

    const currentText = value;
    const cursorPos = textareaRef.current.selectionStart;
    const textBefore = currentText.slice(0, mentionStartIndex);
    const textAfter = currentText.slice(cursorPos);
    const mentionTag = `@${selectedUser.name} `;
    const updatedText = `${textBefore}${mentionTag}${textAfter}`;

    const newMentions = Array.from(new Set([...trackedMentions, selectedUser._id]));
    setTrackedMentions(newMentions);

    if (onChange) {
      onChange(updatedText, newMentions);
    }

    setShowDropdown(false);

    // Refocus and place cursor after inserted mention tag
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = textBefore.length + mentionTag.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleKeyDownInternal = (e) => {
    if (showDropdown && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredUsers[selectedIndex]) {
          handleSelectUser(filteredUsers[selectedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (onSubmit) onSubmit(e);
      return;
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleCursorMove = () => {
    if (textareaRef.current) {
      checkMentionTrigger(value, textareaRef.current.selectionStart);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Mention Dropdown Menu */}
      {showDropdown && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-dark-800 border border-dark-600/80 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md bg-opacity-95">
          <div className="px-3 py-2 bg-dark-900/80 border-b border-dark-700/80 flex items-center justify-between text-xs text-dark-400">
            <span className="flex items-center gap-1.5 font-semibold text-primary-400">
              <AtSign size={13} /> Nhắc đến thành viên
            </span>
            <span className="text-[11px] text-dark-500">↑↓ chọn, Enter tag</span>
          </div>

          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-dark-700/30">
            {filteredUsers.map((u, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  type="button"
                  key={u._id}
                  onClick={() => handleSelectUser(u)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-primary-600/20 text-white border-l-2 border-primary-500 pl-2.5'
                      : 'hover:bg-dark-700/50 text-dark-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow">
                    {(u.name?.slice(0, 1) || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate text-dark-100">{u.name}</p>
                      {u.role && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-dark-700 text-dark-400">
                          {u.role === 'admin' ? 'Admin' : u.role === 'project_manager' ? 'PM' : 'Thành viên'}
                        </span>
                      )}
                    </div>
                    {u.email && <p className="text-xs text-dark-400 truncate">{u.email}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Textarea Input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDownInternal}
        onKeyUp={handleCursorMove}
        onClick={handleCursorMove}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className={className}
      />
    </div>
  );
});

MentionInput.displayName = 'MentionInput';

export default MentionInput;
