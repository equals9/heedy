package run

/**
The plugin file specifies the interface needed to register ourselves with the
plugin registry when we're imported without side effects.
**/

import (
	"connectordb/config"
	"connectordb/plugins"
	"connectordb/streamdb"
	"fmt"
	log "github.com/Sirupsen/logrus"
	"net/http"

	"github.com/gorilla/mux"

	"connectordb/plugins/rest"
	"connectordb/plugins/webclient"
)

func init() {
	// do some sweet plugin registration!
	plugins.Register("run", usage, exec)
}

func exec(db *streamdb.Database, args []string) error {
	log.Printf("Starting Server on port %d", config.GetConfiguration().WebPort)
	r := mux.NewRouter()
	webclient.Setup(r, db)

	// handle the api at its versioned url
	s := r.PathPrefix("/api/v1").Subrouter()
	rest.Router(db, s)

	// all else goes to the webserver
	http.Handle("/", securityHeaderHandler(r))

	return http.ListenAndServe(fmt.Sprintf(":%d", config.GetConfiguration().WebPort), nil)
}

func usage() {
	fmt.Println(`run: runs the HTTP and rest servers`)
}


func securityHeaderHandler(h http.Handler) http.Handler {

	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {

		// See the OWASP security project for these headers:
		// https://www.owasp.org/index.php/List_of_useful_HTTP_headers

		// Don't allow our site to be embedded in another
	    writer.Header().Set("X-Frame-Options", "deny")

		// Enable the client side XSS filter
	    writer.Header().Set("X-XSS-Protection", "1; mode=block")

		// Disable content sniffing which could lead to improperly executed
		// scripts or such from malicious user uploads
	    writer.Header().Set("X-Content-Type-Options", "nosniff")

		h.ServeHTTP(writer, request)
	})
}