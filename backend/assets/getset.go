package assets

import (
	"fmt"
)

func (c *Configuration) GetRequestBodyByteLimit() int64 {
	if c.RequestBodyByteLimit != nil {
		return *c.RequestBodyByteLimit
	}
	return 0
}

func (c *Configuration) GetHost() string {
	if c.Host != nil {
		return *c.Host
	}
	return ""
}

func (c *Configuration) GetPort() uint16 {
	if c.Port != nil {
		return *c.Port
	}
	return 0
}

func (c *Configuration) GetNewConnectionScopes() []string {
	if c.NewConnectionScopes != nil {
		return *c.NewConnectionScopes
	}
	return []string{}
}

func (c *Configuration) GetActivePlugins() []string {
	if c.ActivePlugins == nil {
		return []string{}
	}
	return *c.ActivePlugins
}

// UserIsAdmin checks if the given user is an admin
func (c *Configuration) UserIsAdmin(username string) bool {
	if c.AdminUsers == nil {
		return false
	}
	for _, v := range *c.AdminUsers {
		if v == username {
			return true
		}
	}
	return false
}

// GetSourceType returns the given source type
func (c *Configuration) GetSourceType(sourcetype string) (*SourceType, bool) {
	s, ok := c.SourceTypes[sourcetype]
	return &s, ok
}

// ValidateSourceMeta makes sure that sources have valid metadata
func (c *Configuration) ValidateSourceMeta(sourcetype string, meta *map[string]interface{}) error {
	s, ok := c.SourceTypes[sourcetype]
	if !ok {
		return fmt.Errorf("bad_request: invalid source type '%s'", sourcetype)
	}
	return s.ValidateMeta(meta)
}

// ValidateSourceMetaWithDefaults validates the source, additionally setting required values to defaults
func (c *Configuration) ValidateSourceMetaWithDefaults(sourcetype string, meta map[string]interface{}) error {
	s, ok := c.SourceTypes[sourcetype]
	if !ok {
		return fmt.Errorf("bad_request: invalid source type '%s'", sourcetype)
	}
	return s.ValidateMetaWithDefaults(meta)
}

// GetSourceScopes returns the map of scopes
func (c *Configuration) GetSourceScopes(sourcetype string) (map[string]string,error) {
	s,ok := c.SourceTypes[sourcetype]
	if !ok {
		return nil,fmt.Errorf("bad_request: invalid source type '%s'", sourcetype)
	}
	if s.Scopes==nil {
		return make(map[string]string),nil
	}
	return *s.Scopes, nil
}